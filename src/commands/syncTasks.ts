import * as vsc from 'vscode';
import * as Constants from '../constants';
import { TextProcessor } from '../utils/textProcessor';
import { AzureClient } from '../utils/azure-client';
import { Task, UserStory } from '../models/task';
import { Logger } from '../utils/logger';
import { Configuration } from '../utils/config';
import { TaskMapper } from '../utils/mappers';
import { LockableCommand } from './lockableCommand';

import sortBy from 'lodash.sortby';
import { inspect } from 'util';
import axios from 'axios';

export class SyncTasksCommand extends LockableCommand {
    constructor(
        private client: AzureClient,
        private logger: Logger,
        private config: Configuration) {
        super();
    }

    async sync(line?: number): Promise<void> {
        const editor = vsc.window.activeTextEditor;
        if (!editor || !this.lock()) {
            return;
        }

        await vsc.window.withProgress({ location: vsc.ProgressLocation.Notification }, async progress => {
            try {
                const currentLine = typeof line === 'number' ? line : editor.selection.active.line;
                const lines = editor.document.getText().split(Constants.NewLineRegex);

                const us = TextProcessor.getUserStory(lines, currentLine);
                if (!us) {
                    return this.logger.log('Cannot find user story info in that line');
                }

                if (!us.id) {
                    return;
                }

                progress.report({ increment: 20, message: 'Getting User story info...' });

                const [userStoryInfo] = await this.client.getUserStoryInfo([us.id!]);

                progress.report({ increment: 30, message: 'Getting tasks...' });

                const vsoTaskIds = userStoryInfo.taskUrls.map(this.extractTaskId).filter(x => x) as number[];
                const vsoTasks = (await this.client.getTasksInfo(vsoTaskIds)).map(TaskMapper.fromTaskInfo);

                progress.report({ increment: 40 });

                const newTasks = us.tasks.filter(t => !vsoTaskIds.includes(t.id!)).map(t => {
                    t.activity = t.activity || this.config.defaultActivity || '';
                    return t;
                });

                const mergedTasks = sortBy([...vsoTasks, ...newTasks], ['activity', 'stackRank']);

                await this.updateEditor(editor, us, mergedTasks);

                return Promise.resolve();
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    if (err.response?.status === 404) {
                        vsc.window.showErrorMessage('User story not found or you don\'t have permission to read it');
                    } else {
                        vsc.window.showErrorMessage(err.response?.data?.message || err.message);
                    }
                    this.logger.log(inspect(err.response?.data, { depth: 3 }));
                } else if (err instanceof Error) {
                    vsc.window.showErrorMessage(`An error occured, see extension's output channel for details`);
                    this.logger.log(err.message);
                }
                return Promise.resolve();
            } finally {
                this.unlock();
            }
        });
    }

    private async updateEditor(editor: vsc.TextEditor, us: UserStory, tasks: Task[]) {
        const groupedTasks = tasks.reduce((grouped, current) => {
            const activity = current.activity!;
            grouped[activity] = [...grouped[activity] || [], current];
            return grouped;
        }, <{ [id: string]: Task[] }>{});

        const lines = us.tasks.map(t => t.line);
        const firstLine = us.line + 1;
        const lastLine = Math.max(us.line, ...lines) + 1;

        const range = new vsc.Range(firstLine, 0, lastLine, 0);
        const taskLines: string[] = [];

        for (const activity in groupedTasks) {
            taskLines.push(`${activity}:`);
            taskLines.push(...groupedTasks[activity].map(this.buildTaskLine));
        }

        let replacement = taskLines.join('\n');

        if (firstLine === editor.document.lineCount) {
            replacement = '\n' + replacement;
        } else {
            replacement += '\n';
        }

        await editor.edit((edit: vsc.TextEditorEdit) => edit.replace(range, replacement));
    }

    private buildTaskLine(task: Task): string {
        let estimation = '';
        if (task.estimation) {
            if (task.estimation < 1) {
                estimation = `, ${task.estimation * 60}m`;
            } else {
                estimation = `, ${task.estimation}h`;
            }
        }

        const id = task.id ? ` [#${task.id}]` : '';
        const assignee = task.assignee ? ` @${task.assignee}` : '';
        const tags = task.tags?.length ? ` #${task.tags.join(' #')}` : '';

        return `- ${task.title}${estimation}${assignee}${tags}${id}`;
    }

    private extractTaskId(url: string): number | null {
        const m = Constants.WorkItemIdFromUrl.exec(url);
        return m && parseInt(m[1]);
    }
}

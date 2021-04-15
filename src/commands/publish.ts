import * as vsc from 'vscode';
import * as Constants from '../constants';
import { TextProcessor } from '../utils/textProcessor';
import { ISessionStore } from '../store';
import { AzureClient, TaskInfo, UserStoryInfo } from '../utils/azure-client';
import { Task, UserStory } from '../models/task';
import { Logger } from '../utils/logger';
import { Configuration } from '../utils/config';
import { isNumber } from 'util';
import { WorkItemInfo } from '../models/azure-client/workItems';
import { UserStoryInfoMapper } from '../utils/mappers';
import { LockableCommand } from './lockableCommand';
import { notEmpty } from '../utils/typeCheck';

export class PublishCommand extends LockableCommand {
    constructor(
        private sessionStore: ISessionStore,
        private client: AzureClient,
        private logger: Logger,
        private config: Configuration) {
        super();
    }

    async publish(line?: number): Promise<void> {
        const editor = vsc.window.activeTextEditor;
        if (!editor || !this.lock()) {
            return;
        }

        await vsc.window.withProgress({ location: vsc.ProgressLocation.Notification }, async progress => {
            try {
                const currentLine = line !== undefined ? line : editor.selection.active.line;
                const lines = editor.document.getText().split(Constants.NewLineRegex);

                const us = TextProcessor.getUserStory(lines, currentLine);
                if (!us) {
                    return console.log('Cannot find user story info in that line');
                }

                this.validateUserStory(us);

                progress.report({ increment: 10, message: "Publishing..." });

                const createUserStory = !us.id;
                let userStoryInfo: UserStoryInfo | undefined;

                if (createUserStory) {
                    const iteration = await this.sessionStore.determineIteration();
                    const workItem = await this.client.createUserStory(us.title, iteration.path);
                    userStoryInfo = await this.getUserStoryInfo(workItem);
                } else {
                    userStoryInfo = await this.getUserStoryInfo(us);
                }

                progress.report({ increment: 10 });

                if (!userStoryInfo) {
                    return;
                }

                const vsoTaskIds = userStoryInfo.taskUrls.map(this.extractTaskId).filter(x => x) as number[];
                const maxStackRank = await this.client.getMaxTaskStackRank(vsoTaskIds);
                let firstFreeStackRank = maxStackRank + 1;

                progress.report({ increment: 10 });

                const requests = us.tasks.map(t => this.buildTaskInfo(t, userStoryInfo as UserStoryInfo, t.id ? undefined : firstFreeStackRank++));

                const increment = 70 / requests.length;
                const taskIds: number[] = [];

                for (const request of requests) {
                    taskIds.push(await this.client.createOrUpdateTask(request));
                    progress.report({ increment });
                }

                await this.updateEditor(editor, us, taskIds, createUserStory ? userStoryInfo.id : undefined);
                this.showSummary(userStoryInfo.id, us.tasks);

                return Promise.resolve();
            } catch (err) {
                if (err) {
                    vsc.window.showErrorMessage(err.message);
                    this.logger.log(err);
                    return Promise.resolve();
                }
            } finally {
                this.unlock();
            }
        });
    }

    private showSummary(usId: number, tasks: Task[]) {
        const updatedTasks = tasks.filter(x => !!x.id).length;
        const createdTasks = tasks.length - updatedTasks;

        vsc.window.showInformationMessage(`Published ${tasks.length} tasks for US#${usId} (${createdTasks} created, ${updatedTasks} updated)`);
    }

    private validateUserStory(us: UserStory) {
        const createUserStory = !us.id;

        const taskIds = us.tasks.map(t => t.id).filter(notEmpty).map(id => id.toString());
        if (createUserStory && taskIds.length > 0) {
            throw new Error(`Tasks cannot have IDs when creating User Story (#${taskIds.join(', #')})`);
        }

        const occurences = taskIds.reduce((acc, id) => {
            acc[id] = acc[id] || 0;
            acc[id]++;
            return acc;
        }, {} as { [key: string]: number });

        const duplicateIds = Object.entries(occurences).filter(x => (<number>x[1]) > 1).map(x => '#' + x[0]);
        if (duplicateIds.length > 0) {
            throw new Error(`Duplicate tasks found: ${duplicateIds.join(', ')}`);
        }
    }

    private async getUserStoryInfo(us: UserStory | WorkItemInfo) {
        if (this.isUserStory(us)) {
            await this.sessionStore.ensureHasUserStories();

            if (!this.sessionStore.userStories) {
                return;
            }

            const userStoryInfo = this.sessionStore.userStories.find(x => x.id === us.id);

            if (!userStoryInfo) {
                console.log(`US#${us.id} is not present in session cache, is the ID correct?`);
            }

            return userStoryInfo;
        } else {
            return UserStoryInfoMapper.fromWorkItemInfo(us);
        }
    }

    private isUserStory(us: UserStory | WorkItemInfo): us is UserStory {
        return (us as UserStory).line !== undefined;
    }

    private async updateEditor(editor: vsc.TextEditor, us: UserStory, taskIds: number[], createdUserStoryId?: number) {
        await editor.edit((edit: vsc.TextEditorEdit) => {
            if (createdUserStoryId) {
                // Format of the line: US#new - <title>
                const newIdx = Constants.UserStoryPrefix.length;
                const startPos = new vsc.Position(us.line, newIdx);
                edit.replace(new vsc.Range(startPos, startPos.translate(undefined, "new".length)), createdUserStoryId.toString());
            }

            for (let i = 0; i < us.tasks.length; i++) {
                if (isNumber(taskIds[i])) {
                    const task = us.tasks[i];
                    const taskIdHasChanged = task.id !== taskIds[i];
                    if (taskIdHasChanged) {
                        const lineLength = editor.document.lineAt(task.line).text.length;
                        edit.insert(new vsc.Position(task.line, lineLength), ` [#${taskIds[i]}]`);
                    }
                }
            }
        });
    }

    private extractTaskId(url: string): number | null {
        const m = Constants.WorkItemIdFromUrl.exec(url);
        return m && parseInt(m[1]);
    }

    private buildTaskInfo(task: Task, userStory: UserStoryInfo, stackRank?: number): TaskInfo {
        return {
            id: task.id,
            title: task.title,
            description: task.description,
            areaPath: userStory.areaPath,
            teamProject: userStory.teamProject,
            iterationPath: userStory.iterationPath,
            activity: task.activity || this.config.defaultActivity || '',
            estimation: task.estimation,
            userStoryUrl: userStory.url,
            stackRank: stackRank
        };
    }
}

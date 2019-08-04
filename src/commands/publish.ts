import * as vsc from 'vscode';
import * as Constants from '../constants';
import { TextProcessor } from '../utils/textProcessor';
import { SessionStore } from '../store';
import { AzureClient, TaskInfo, UserStoryInfo } from '../utils/azure-client';
import { Task } from '../models/task';
import { Logger } from '../utils/logger';
import { Configuration } from '../utils/config';
import { isNumber } from 'util';

export class PublishCommand {
	constructor(
		private sessionStore: SessionStore,
		private client: AzureClient,
		private logger: Logger,
		private config: Configuration) { }

	async publish(line?: number) {
		const editor = vsc.window.activeTextEditor;
		if (!editor) { return; }

		try {
			let currentLine = line !== undefined ? line : editor.selection.active.line;
			const lines = editor.document.getText().split(Constants.NewLineRegex);

			const us = TextProcessor.getUserStory(lines, currentLine);
			if (!us) {
				return console.log('Cannot find user story info');
			}

			if (!this.ValidateTasks(us.tasks)) {
				return;
			}

			await this.sessionStore.ensureHasUserStories();

			const userStoryInfo = this.sessionStore.userStories!.find(x => x.id === us.id);
			if (!userStoryInfo) {
				return console.log(`US#${us.id} is not present in session cache, is the ID correct?`);
			}

			const vsoTaskIds = userStoryInfo.taskUrls.map(this.extractTaskId).filter(x => x) as number[];
			const maxStackRank = await this.client.getMaxTaskStackRank(vsoTaskIds);
			let firstFreeStackRank = maxStackRank + 1;

			const requests = us.tasks.map(t => this.buildTaskInfo(t, userStoryInfo, t.id ? undefined : firstFreeStackRank++));

			let taskIds = await Promise.all(requests.map(r => this.client.createOrUpdateTask(r)));

			await this.AppendTaskIds(editor, us, taskIds);

			const updatedTasks = us.tasks.filter(x => !!x.id).length;
			const createdTasks = us.tasks.length - updatedTasks;

			vsc.window.showInformationMessage(`Published ${us.tasks.length} tasks for US#${us.id} (${createdTasks} created, ${updatedTasks} updated)`);
		} catch (err) {
			if (err) {
				vsc.window.showErrorMessage(err.message);
				this.logger.log(err);
			}
		}
	}

	private ValidateTasks(tasks: Task[]) {
		const taskIds = tasks.filter(t => t.id).map(t => t.id!.toString());
		const occurences = taskIds.reduce((acc, id) => {
			acc[id] = acc[id] || 0;
			acc[id]++;
			return acc;
		}, {} as { [key: string]: number });

		const duplicateIds = Object.entries(occurences).filter(x => (<number>x[1]) > 1).map(x => '#' + x[0]);
		if (duplicateIds.length > 0) {
			vsc.window.showWarningMessage(`Duplicate tasks found: ${duplicateIds.join(', ')}`);
			return false;
		}

		return true;
	}

	private async AppendTaskIds(editor: vsc.TextEditor, us: import("d:/Dev/src/vscode/vscode-sprint-planner/src/models/task").UserStory, taskIds: number[]) {
		await editor.edit((edit: vsc.TextEditorEdit) => {
			for (let i = 0; i < us.tasks.length; i++) {
				if (isNumber(taskIds[i])) {
					const task = us.tasks[i];
					const taskIsUpdated = task.id === taskIds[i];
					if (!taskIsUpdated) {
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
			activity: task.activity || this.config.defaultActivity!,
			estimation: task.estimation,
			userStoryUrl: userStory.url,
			stackRank: stackRank
		};
	}
}

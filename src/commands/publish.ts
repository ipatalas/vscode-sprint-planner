import * as vsc from 'vscode';
import * as Constants from '../constants';
import { TextProcessor } from '../utils/textProcessor';
import { SessionStore } from '../store';
import { AzureClient, TaskInfo, UserStoryInfo } from '../utils/azure-client';
import { Task } from '../models/task';
import { Logger } from '../utils/logger';

export class PublishCommand {
	constructor(private sessionStore: SessionStore, private client: AzureClient, private logger: Logger) { }

	async publish(line?: number) {
		const editor = vsc.window.activeTextEditor;
		if (!editor) return;

		try {
			let currentLine = line !== undefined ? line : editor.selection.active.line;
			const lines = editor.document.getText().split(Constants.NewLineRegex);

			const us = TextProcessor.getUserStory(lines, currentLine);
			if (!us) {
				return console.log('Cannot find user story info');
			}

			await this.sessionStore.ensureHasUserStories();

			const userStoryInfo = this.sessionStore.userStories!.find(x => x.id == us.id);
			if (!userStoryInfo) {
				return console.log(`US#${us.id} is not present in session cache, is the ID correct?`);
			}

			const taskIds = userStoryInfo.taskUrls.map(this.extractTaskId).filter(x => x) as number[];
			const maxStackRank = await this.client.getMaxTaskStackRank(taskIds);

			const requests = us.tasks.map((t, i) => this.buildTaskInfo(t, userStoryInfo, maxStackRank + i + 1));

			await Promise.all(requests.map(r => this.client.createTask(r)));

			vsc.window.showInformationMessage(`Published ${us.tasks.length} tasks for US#${us.id}`);
		} catch (err) {
			if (typeof err === 'string') {
				vsc.window.showErrorMessage(err);
			} else {
				this.logger.log(err);
				console.error(err);
			}
		}
	}

	private extractTaskId(url: string): number | null {
		const m = Constants.WorkItemIdFromUrl.exec(url);
		return m && parseInt(m[1]);
	}

	private buildTaskInfo(task: Task, userStory: UserStoryInfo, stackRank: number): TaskInfo {
		return {
			title: task.title,
			description: task.description,
			areaPath: userStory.areaPath,
			teamProject: userStory.teamProject,
			iterationPath: userStory.iterationPath,
			activity: 'Development',
			estimation: task.estimation,
			userStoryUrl: userStory.url,
			stackRank: stackRank
		};
	}
}

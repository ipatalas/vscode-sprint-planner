import * as vsc from 'vscode';
import * as Constants from '../constants';
import { TextProcessor } from '../utils/textProcessor';
import { SessionStore } from '../store';
import { AzureClient, TaskInfo, UserStoryInfo } from '../utils/azure-client';
import { Task } from '../models/task';

export class PublishCommand {
	constructor(private sessionStore: SessionStore, private client: AzureClient) { }

	async publish(line?: number) {
		const editor = vsc.window.activeTextEditor;
		if (!editor) return;

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

		const requests = us.tasks.map(t => this.buildTaskInfo(t, userStoryInfo));

		await Promise.all(requests.map(r => this.client.createTask(r)));

		console.table(us.tasks);

		vsc.window.showInformationMessage(`Published ${us.tasks.length} tasks for US#${us.id}`);
	}

	private buildTaskInfo(task: Task, userStory: UserStoryInfo): TaskInfo {
		return {
			title: task.title,
			description: task.description,
			areaPath: userStory.areaPath,
			teamProject: userStory.teamProject,
			iterationPath: userStory.iterationPath,
			activity: 'Development',
			estimation: task.estimation,
			userStoryUrl: userStory.url,
		};
	}
}
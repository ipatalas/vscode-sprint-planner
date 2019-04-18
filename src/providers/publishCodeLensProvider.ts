import * as vsc from 'vscode';
import { Commands, NewLineRegex } from '../constants';
import { TextProcessor } from '../utils/textProcessor';
import { Task } from '../models/task';

export class PublishCodeLensProvider implements vsc.CodeLensProvider {
	provideCodeLenses(_document: vsc.TextDocument, _token: vsc.CancellationToken): vsc.ProviderResult<vsc.CodeLens[]> {
		const editor = vsc.window.activeTextEditor!;
		const lines = editor.document.getText().split(NewLineRegex);

		const userStoryLines = TextProcessor.getUserStoryLineIndices(lines);

		return userStoryLines.map(line => {
			const us = TextProcessor.getUserStory(lines, line)!;

			return new vsc.CodeLens(
				new vsc.Range(line, 0, line, lines[line].length),
				{
					title: `Publish to Azure DevOps, ${this.buildExtraInfo(us)}`,
					command: Commands.publish,
					arguments: [line]
				}
			);
		});
	}

	private buildExtraInfo({tasks}: {tasks: Task[]}) {
		const totalHours =
			tasks.filter(t => t.estimation)
				 .map(t => t.estimation!)
				 .reduce((sum, hours) => {
					 sum += hours;
					 return sum;
				}, 0);

		if (tasks.length === 0) {
			return 'no tasks';
		}

		const tasksText = tasks.length === 1 ? 'task' : 'tasks';

		return `${tasks.length} ${tasksText} (${totalHours}h)`;
	}
}
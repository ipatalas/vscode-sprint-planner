import * as vsc from 'vscode';
import { Commands, NewLineRegex } from '../constants';
import { TextProcessor } from '../utils/textProcessor';
import { Task } from '../models/task';

export class PublishCodeLensProvider implements vsc.CodeLensProvider {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	provideCodeLenses(_document: vsc.TextDocument, _token: vsc.CancellationToken): vsc.ProviderResult<vsc.CodeLens[]> {
		const editor = vsc.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const lines = editor.document.getText().split(NewLineRegex);

		const userStoryLines = TextProcessor.getUserStoryLineIndices(lines);

		return userStoryLines.map(line => {
			const us = TextProcessor.getUserStory(lines, line);

			return new vsc.CodeLens(
				new vsc.Range(line, 0, line, lines[line].length),
				{
					title: `Publish to Azure DevOps, ${this.buildExtraInfo(us?.tasks)}`,
					command: Commands.publish,
					arguments: [line]
				}
			);
		});
	}

	private buildExtraInfo(tasks: Task[] | undefined) {

		if (!tasks || tasks.length === 0) {
			return 'no tasks';
		}

		const totalHours =
			tasks.filter(t => t.estimation)
				.map(t => t.estimation)
				.reduce<number>((sum, hours) => {
					sum += hours ?? 0;
					return sum;
				}, 0);

		const tasksText = tasks.length === 1 ? 'task' : 'tasks';

		return `${tasks.length} ${tasksText} (${totalHours}h)`;
	}
}
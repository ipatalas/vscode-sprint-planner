import * as vsc from 'vscode';
import * as Constants from '../constants';
import { TextProcessor } from '../utils/textProcessor';

export function publish(line?: number) {
	const editor = vsc.window.activeTextEditor;
	if (!editor) return;

	let currentLine = line !== undefined ? line : editor.selection.active.line;
	const lines = editor.document.getText().split(Constants.NewLineRegex);

	const us = TextProcessor.getUserStory(lines, currentLine);
	if (!us) {
		console.log('Cannot find user story info');
		return;
	}

	console.table(us.tasks);
}

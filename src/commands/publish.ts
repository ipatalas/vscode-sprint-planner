import * as vsc from 'vscode';
import * as Constants from '../constants';
import { TextProcessor } from '../utils/textProcessor';

export function publish() {
	const editor = vsc.window.activeTextEditor;
	if (!editor) return;

	let currentLine = editor.selection.active.line;
	const lines = editor.document.getText().split(Constants.NewLineRegex);

	const us = TextProcessor.getUserStory(lines, currentLine);
	if (!us) {
		console.log('Cannot find user story info');
		return;
	}

	console.table(us.tasks);
}

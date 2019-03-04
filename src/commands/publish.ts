import * as vsc from 'vscode';
import * as Constants from '../constants';
import { Task } from '../models/task';

export function publish() {
	const editor = vsc.window.activeTextEditor;
	if (!editor) return;

	let currentLine = editor.selection.active.line;
	const lines = editor.document.getText().split(/\r?\n/g);

	const userStoryInfo = getUserStoryInfo(lines, currentLine);
	if (!userStoryInfo) {
		console.log('Cannot find user story info');
		return;
	}

	const [usLine, usId] = userStoryInfo;

	const tasks = getTasksInfo(lines, usLine + 1);
	console.table(tasks);
}

function getTasksInfo(lines: string[], currentLine: number) {
	const firstTaskLine = currentLine;
	let lastTaskLine = lines.length - 1;

	// find user story breaking pattern
	for	(; currentLine < lines.length; currentLine++) {
		if (isEndOfUserStory(lines[currentLine])) {
			lastTaskLine = currentLine - 1;
			break;
		}
	}

	if (firstTaskLine <= lastTaskLine) {
		return lines.slice(firstTaskLine, lastTaskLine + 1).map(getTask);
	}

	return [];
}

function getTask(line: string): Task {
	const task = <Task>{};

	line = line.replace(Constants.TaskPrefixRegex, '');

	const match = line.match(Constants.TaskEstimationRegex);
	if (match != null) {
		task.estimation = parseInt(match.groups!.estimation);
		line = line.replace(match[0], '');
	}

	task.title = line;
	return task;
}

function getUserStoryInfo(lines: string[], currentLine: number) {
	for	(; currentLine >= 0; currentLine--) {
		const id = getUserStoryID(lines[currentLine]);
		if (id) {
			return [currentLine, parseInt(id)];
		}
	}
}

function getUserStoryID(line: string) {
	const match = Constants.UserStoryRegex.exec(line);
	return match != null && match[1];
}

function isEndOfUserStory(line: string) {
	return Constants.EndOfUserStoryRegex.test(line) || Constants.UserStoryRegex.test(line);
}
import * as Constants from '../constants';
import { Task } from '../models/task';

export class TextProcessor {

	public static getUserStory(allLines: string[], currentLine: number) {
		const userStoryInfo = TextProcessor.getUserStoryInfo(allLines, currentLine);
		if (!userStoryInfo) {
			return;
		}

		const [usLine] = userStoryInfo;
		const tasks = TextProcessor.getTasksInfo(allLines, usLine + 1);

		return {
			line: userStoryInfo[0],
			id: userStoryInfo[1],
			tasks
		}
	}

	private static getUserStoryInfo(lines: string[], currentLine: number) {
		for (; currentLine >= 0; currentLine--) {
			const id = TextProcessor.getUserStoryID(lines[currentLine]);
			if (id) {
				return [currentLine, parseInt(id)];
			}
		}
	}

	private static getTasksInfo(lines: string[], currentLine: number) {
		const firstTaskLine = currentLine;
		let lastTaskLine = lines.length - 1;

		// find user story breaking pattern
		for (; currentLine < lines.length; currentLine++) {
			if (TextProcessor.isEndOfUserStory(lines[currentLine])) {
				lastTaskLine = currentLine - 1;
				break;
			}
		}

		if (firstTaskLine <= lastTaskLine) {
			return lines.slice(firstTaskLine, lastTaskLine + 1).map(TextProcessor.getTask);
		}

		return [];
	}

	private static getTask(line: string): Task {
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

	private static getUserStoryID(line: string) {
		const match = Constants.UserStoryRegex.exec(line);
		return match != null && match[1];
	}

	private static isEndOfUserStory(line: string) {
		return Constants.EndOfUserStoryRegex.test(line) || Constants.UserStoryRegex.test(line);
	}
}


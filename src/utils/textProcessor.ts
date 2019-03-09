import * as Constants from '../constants';
import { Task } from '../models/task';
import { EOL } from "os";

export class TextProcessor {

	public static getUserStoryLineIndices(allLines: string[]) {
		const results: number[] = [];

		for (let i = 0; i < allLines.length; i++) {
			if (Constants.UserStoryRegex.test(allLines[i])) {
				results.push(i);
			}
		}

		return results;
	}

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
			const taskLines = lines
				.slice(firstTaskLine, lastTaskLine + 1)
				.join(EOL)
				.split(Constants.TaskLinesSplitter);

			return taskLines.map(this.getTask)
		}

		return [];
	}

	private static getTask(taskLine: string): Task {
		let [title, ...description] = taskLine.split(EOL);

		const task = <Task>{};

		title = title.replace(Constants.TaskPrefixRegex, '');

		const match = title.match(Constants.TaskEstimationRegex);
		if (match != null) {
			task.estimation = parseInt(match.groups!.estimation);
			title = title.replace(match[0], '');
		}

		task.title = title;
		task.description = description.map(d => d.trimLeft());

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


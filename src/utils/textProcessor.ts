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

	public static getIteration(allLines: string[], currentLine: number) {
		const iterationInfo = TextProcessor.getIterationInfo(allLines, currentLine);
		if (!iterationInfo) {
			return;
		}

		return {
			line: iterationInfo[0],
			id: iterationInfo[1]
		};
	}

	private static getIterationInfo(lines: string[], currentLine: number) {
		for (; currentLine >= 0; currentLine--) {
			const id = TextProcessor.getIterationID(lines[currentLine]);
			if (id) {
				return [currentLine, id];
			}
		}
	}

	private static getIterationID(line: string) {
		console.log('Getting Iteration Id');
		const match = Constants.IterationRegex.exec(line);
		return match !== null && match[1];
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
		};
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

			const tasks = [];
			let activity = undefined;

			for (const line of taskLines) {
				if (this.isActivityLine(line)) {
					activity = line.substr(0, line.length - 1);
				} else {
					tasks.push(this.getTask(line, activity));
				}
			}

			return tasks;
		}

		return [];
	}

	private static getTask(taskLine: string, activity?: string): Task {
		let [title, ...description] = taskLine.split(EOL);

		const task = <Task>{};

		title = title.replace(Constants.TaskPrefixRegex, '');

		const match = title.match(Constants.TaskEstimationRegex);
		if (match !== null) {
			task.estimation = parseInt(match.groups!.estimation);
			title = title.replace(match[0], '');
		}

		task.title = title;
		task.description = description.map(d => d.trimLeft());
		task.activity = activity;

		return task;
	}

	private static getUserStoryID(line: string) {
		const match = Constants.UserStoryRegex.exec(line);
		return match !== null && match[1];
	}

	private static isEndOfUserStory(line: string) {
		let isEndOfUserStory = Constants.EndOfUserStoryRegex.test(line) || Constants.UserStoryRegex.test(line);
		return isEndOfUserStory;
	}

	private static isActivityLine(line: string) {
		return Constants.ActivityTypeLine.test(line);
	}
}


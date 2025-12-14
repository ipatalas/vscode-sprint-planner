import * as Constants from '../constants';
import { IterationTextLine, Task, UserStory } from '../models/task';

export class TextProcessor {

    public static getUserStoryLineIndices(allLines: string[]): number[] {
        const results: number[] = [];

        for (let i = 0; i < allLines.length; i++) {
            if (Constants.UserStoryRegex.test(allLines[i])) {
                results.push(i);
            }
        }

        return results;
    }

    public static getIteration(allLines: string[], currentLine: number): IterationTextLine | undefined {
        const iterationInfo = TextProcessor.getIterationInfo(allLines, currentLine);
        if (!iterationInfo) {
            return undefined;
        }

        return iterationInfo;
    }

    private static getIterationInfo(lines: string[], currentLine: number): IterationTextLine | undefined {
        for (; currentLine >= 0; currentLine--) {
            const id = TextProcessor.getIterationID(lines[currentLine]);
            if (id) {
                return <IterationTextLine>{
                    line: currentLine,
                    id: id
                };
            }
        }

        return undefined;
    }

    private static getIterationID(line: string) {
        console.log('Getting Iteration Id');
        const match = Constants.IterationRegex.exec(line);
        return match !== null && match[1];
    }

    public static getUserStory(allLines: string[], currentLine: number): UserStory | undefined {
        const userStoryInfo = TextProcessor.getUserStoryInfo(allLines, currentLine);
        if (!userStoryInfo) {
            return;
        }

        const areaIdx = TextProcessor.getAreasIndices(allLines, userStoryInfo.line).pop();
        const tasks = TextProcessor.getTasksInfo(allLines, userStoryInfo.line + 1);

        return <UserStory>{
            line: userStoryInfo.line,
            id: userStoryInfo.id,
            title: userStoryInfo.title,
            areaPath: typeof areaIdx === 'number' && TextProcessor.getAreaName(allLines, areaIdx) || undefined,
            tasks
        };
    }

    private static getUserStoryInfo(lines: string[], currentLine: number) {
        for (; currentLine >= 0; currentLine--) {
            const match = Constants.UserStoryRegex.exec(lines[currentLine]);

            if (match?.groups) {
                const { id, title } = match.groups;

                return {
                    line: currentLine,
                    id: id === 'new' ? undefined : parseInt(id),
                    title
                };
            }
        }

        return undefined;
    }

    public static getAreasIndices(allLines: string[], userStoryLine?: number): number[] {
        const results: number[] = [];
        const maxAreaIdx = typeof userStoryLine === 'number' ? userStoryLine : allLines.length;

        for (let i = 0; i < maxAreaIdx; i++) {
            if (allLines[i].startsWith(Constants.AreaPrefix)) {
                results.push(i);
            }
        }

        return results;
    }

    public static getAreaName(allLines: string[], currentLine: number): string {
        return allLines[currentLine].substring(Constants.AreaPrefix.length);
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
            const taskLines = lines.slice(firstTaskLine, lastTaskLine + 1);

            const tasks: Task[] = [];
            let description: string[] = [];
            let activity = undefined;

            let lineNo = firstTaskLine;

            const updateDescription = (description: string[]) => {
                if (tasks.length > 0) {
                    tasks[tasks.length - 1].description = description;
                }
            };

            for (const line of taskLines) {
                if (this.isActivityLine(line)) {
                    activity = line.substr(0, line.length - 1);
                } else if (this.isTaskDescriptionLine(line)) {
                    description.push(line.trimLeft());
                } else {
                    updateDescription(description);
                    description = [];
                    tasks.push(this.getTask(line, lineNo, activity));
                }
                lineNo++;
            }

            updateDescription(description);

            return tasks;
        }

        return [];
    }

    private static getTask(taskTitle: string, lineNo: number, activity?: string): Task {
        const task = <Task>{};

        taskTitle = taskTitle.replace(Constants.TaskPrefixRegex, '');

        const matchId = taskTitle.match(Constants.TaskIdRegex);
        if (matchId?.groups) {
            const id = matchId.groups.id;

            task.id = parseInt(id);
            taskTitle = taskTitle.replace(matchId[0], '');
        }

        const match = taskTitle.match(Constants.TaskEstimationRegex);
        if (match?.groups) {
            const est = match.groups.estimation;
            if (est) {
                task.estimation = parseFloat(est);
            } else {
                const minutes = parseInt(match.groups.estimation_m);
                task.estimation = Math.floor(minutes / 60 * 100) / 100;
            }
            taskTitle = taskTitle.replace(match[0], '');
        }

        const matchAssignee = taskTitle.match(Constants.TaskAssigneeRegex);
        if (matchAssignee?.groups) {
            const assignee = matchAssignee.groups.assignee;
            task.assignee = assignee;
            taskTitle = taskTitle.replace(matchAssignee[0], '');
        }

        const matchTags = [...taskTitle.matchAll(Constants.TaskTagsRegex)];
        if (matchTags?.length > 0) {

            const tags = matchTags.map(m => m.groups?.tags)
                .filter((tag): tag is string => typeof tag === 'string');
            task.tags = tags;
            taskTitle = taskTitle.replace(Constants.TaskTagsRegex, '');
        }


        task.title = taskTitle;
        task.activity = activity;
        task.line = lineNo;

        return task;
    }

    private static isEndOfUserStory(line: string) {
        const isEndOfUserStory = Constants.EndOfUserStoryRegex.test(line) || Constants.UserStoryRegex.test(line);
        return isEndOfUserStory;
    }

    private static isActivityLine = (line: string) => Constants.ActivityTypeLine.test(line);
    private static isTaskDescriptionLine = (line: string) => Constants.TaskDescriptionRegex.test(line);
}


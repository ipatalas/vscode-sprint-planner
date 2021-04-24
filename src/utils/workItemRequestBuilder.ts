import { TaskOperation } from '../models/workItemRequestBuilder';
import { TaskInfo } from './azure-client';

export class WorkItemRequestBuilder {
	public createTaskRequest(task: TaskInfo): TaskOperation[]  {
		return this.createOrUpdateTask(task, true);
	}

	public updateTaskRequest(task: TaskInfo): TaskOperation[] {
		return this.createOrUpdateTask(task, false);
	}

	private createOrUpdateTask(task: TaskInfo, createNewTask: boolean): TaskOperation[] {
		const request = [
			this.addOperation('/fields/System.Title', task.title),
			this.addOperation('/fields/Microsoft.VSTS.Common.Activity', task.activity)
		];

		if (createNewTask) {
			request.push(...[
				this.addOperation('/fields/System.AreaPath', task.areaPath),
				this.addOperation('/fields/System.TeamProject', task.teamProject),
				this.addOperation('/fields/System.IterationPath', task.iterationPath),
				this.addOperation('/relations/-', this.userStoryLink(task.userStoryUrl))
			]);
		}

		if (task.stackRank) {
			request.push(this.addOperation('/fields/Microsoft.VSTS.Common.StackRank', task.stackRank));
		}

		if (task.description && task.description.length > 0) {
			request.push(this.addOperation('/fields/System.Description', `<div>${task.description.join('</div><div>')}</div>`));
		}

		if (task.estimation) {
			request.push(...[
				this.addOperation('/fields/Microsoft.VSTS.Scheduling.RemainingWork', task.estimation),
				this.addOperation('/fields/Microsoft.VSTS.Scheduling.OriginalEstimate', task.estimation)
			]);
		}

		return request;
	}

	public createUserStory(title: string, iterationPath: string, areaPath?: string): TaskOperation[] {
		const request = [
			this.addOperation('/fields/System.Title', title),
			this.addOperation('/fields/System.IterationPath', iterationPath)
		];

        if (areaPath) {
            request.push(this.addOperation('/fields/System.AreaPath', areaPath));
        }

		return request;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private addOperation(path: string, value: any): TaskOperation {
		return {
			op: 'add',
			path,
			value
		};
	}

	private userStoryLink(url: string) {
		return {
			rel: 'System.LinkTypes.Hierarchy-Reverse',
			url
		};
	}
}
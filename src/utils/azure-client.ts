import axios, { AxiosInstance } from 'axios';
import * as vsc from 'vscode';

import { IterationsResult } from '../models/azure-client/iterations';
import { IterationWorkItemsResult } from '../models/azure-client/iterationsWorkItems';
import { WorkItemInfoResult, WorkItemCreatedResponse } from '../models/azure-client/workItems';
import { Logger } from './logger';
import { Stopwatch } from './stopwatch';
import { Configuration } from './config';

export class AzureClient implements vsc.Disposable {
	private _apiVersionPreview = {
		'api-version': '5.0-preview.1'
	}

	client!: AxiosInstance;
	_eventHandler: vsc.Disposable;

	constructor(config: Configuration, private logger: Logger) {
		this.recreateClient(config);

		this._eventHandler = config.onDidChange(cfg => this.recreateClient(cfg));
	}

	dispose() {
		this._eventHandler.dispose();
	}

	private recreateClient(config: Configuration) {
		let url = config.url!;

		if (!url.endsWith('/')) {
			url += '/';
		}

		url += '_apis/';

		this.client = axios.create({
			baseURL: config.url,
			auth: {
				username: "PAT",
				password: config.token || ""
			},
			params: {
				'api-version': "5.0"
			}
		});
	}

	public async getCurrentIterationInfo(): Promise<IterationInfo> {
		const finish = this.logger.perf('Getting current iteration info...');
		const result = await this.client.get<IterationsResult>("/work/teamsettings/iterations?$timeframe=current");
		finish();

		if (result.data.count > 0) {
			const iteration = result.data.value[0];
			return <IterationInfo>{
				id: iteration.id,
				name: iteration.name,
				path: iteration.path
			}
		}

		throw "Current iteration not found";
	}

	public async getIterationUserStories(iterationId: string): Promise<UserStoryIdentifier[]> {
		const finish = this.logger.perf('Getting user stories for iteration...');
		const result = await this.client.get<IterationWorkItemsResult>(`/work/teamsettings/iterations/${iterationId}/workitems`, {
			params: {
				...this._apiVersionPreview
			}
		});

		finish();

		return result.data.workItemRelations.filter(x => x.rel == null).map(x => (
			<UserStoryIdentifier>{
				id: x.target.id,
				url: x.target.url
			}
		));
	}

	public async getUserStoryInfo(userStoryIds: number[]): Promise<UserStoryInfo[]> {
		const finish = this.logger.perf('Getting user story info...');

		const params = <any>{
			ids: userStoryIds.join(','),
			'$expand': 'Relations'
		};

		const result = await this.client.get<WorkItemInfoResult>('/wit/workitems', { params });
		finish();

		return result.data.value.map(x => (
			<UserStoryInfo>{
				id: x.id,
				url: x.url,
				title: x.fields["System.Title"],
				areaPath: x.fields["System.AreaPath"],
				teamProject: x.fields["System.TeamProject"],
				iterationPath: x.fields["System.IterationPath"],
				taskUrls: x.relations && x.relations.filter(r => r.rel == 'System.LinkTypes.Hierarchy-Forward').map(r => r.url)
			}
		));
	}

	public async getMaxTaskStackRank(taskIds: number[], ): Promise<number> {
		const finish = this.logger.perf('Getting max stack rank for tasks...');

		const params = <any>{
			ids: taskIds.join(','),
			fields: ['Microsoft.VSTS.Common.StackRank'].join(',')
		};

		const result = await this.client.get<WorkItemInfoResult>('/wit/workitems', { params });
		const stackRanks = result.data.value.map(t => t.fields["Microsoft.VSTS.Common.StackRank"]);

		finish();

		const max = stackRanks.reduce((acc, current) => {
			acc = Math.max(acc, current);
			return acc;
		}, 0);

		this.logger.log(`Max Stack Rank: ${max}`);

		return max;
	}

	public createTask(task: TaskInfo): Promise<number> {
		const request = [
			this.addOperation('/fields/System.Title', task.title),
			this.addOperation('/fields/System.AreaPath', task.areaPath),
			this.addOperation('/fields/System.TeamProject', task.teamProject),
			this.addOperation('/fields/System.IterationPath', task.iterationPath),
			this.addOperation('/fields/Microsoft.VSTS.Common.Activity', task.activity),
			this.addOperation('/fields/Microsoft.VSTS.Common.StackRank', task.stackRank),
			this.addOperation('/relations/-', this.userStoryLink(task.userStoryUrl)),
		];

		if (task.description && task.description.length > 0) {
			request.push(this.addOperation('/fields/System.Description', `<div>${task.description.join("</div><div>")}</div>`));
		}

		if (task.estimation) {
			request.push(...[
				this.addOperation('/fields/Microsoft.VSTS.Scheduling.RemainingWork', task.estimation),
				this.addOperation('/fields/Microsoft.VSTS.Scheduling.OriginalEstimate', task.estimation)
			]);
		}

		this.logger.log(`Creating task: ${task.title}...`);
		let stopwatch = Stopwatch.startNew();

		return this.client.post<WorkItemCreatedResponse>(
			'/wit/workitems/$Task', request, {
				headers: {
					'Content-Type': 'application/json-patch+json'
				}
			}).then(res => {
				this.logger.log(`#${res.data.id} Task '${task.title}' created (${stopwatch.toString()})`);
				return res.data.id;
			})
			.catch(err => {
				console.error(err);
				return -1;
			});
	}

	private addOperation(path: string, value: any) {
		return {
			op: 'add',
			path,
			value
		}
	}

	private userStoryLink(url: string) {
		return {
			rel: "System.LinkTypes.Hierarchy-Reverse",
			url
		}
	}
}

export interface IterationInfo {
	id: string;
	name: string;
	path: string;
}

export interface UserStoryIdentifier {
	id: number;
	url: string;
}

export interface UserStoryInfo {
	id: number;
	url: string;
	title: string;
	areaPath: string;
	teamProject: string;
	iterationPath: string;
	taskUrls: string[];
}

export interface TaskInfo {
	title: string;
	description?: string[];
	areaPath: string;
	teamProject: string;
	iterationPath: string;
	activity: string;
	estimation?: number;
	userStoryUrl: string;
	stackRank: number;
}
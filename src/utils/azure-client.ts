import axios, { AxiosInstance } from 'axios';
import * as vsc from 'vscode';

import { IterationsResult } from '../models/azure-client/iterations';
import { IterationWorkItemsResult } from '../models/azure-client/iterationsWorkItems';
import { WorkItemInfoResult, WorkItemCreatedResponse } from '../models/azure-client/workItems';
import { FieldDefinition } from '../models/azure-client/fields';
import { Logger } from './logger';
import { Stopwatch } from './stopwatch';
import { Configuration } from './config';

export class AzureClient implements vsc.Disposable {
	private _apiVersionPreview = {
		'api-version': '5.0-preview.1'
	};

	client!: AxiosInstance;
	teamClient!: AxiosInstance;
	_eventHandler: vsc.Disposable;
	_interceptors: number[] = [];

	constructor(config: Configuration, private logger: Logger) {
		this.recreateClient(config);

		this._eventHandler = config.onDidChange(cfg => this.recreateClient(cfg));
	}

	dispose() {
		this._eventHandler.dispose();
	}

	private recreateClient(config: Configuration) {
		if (this._interceptors.length > 0) {
			this._interceptors.forEach(id => {
				this.client.interceptors.response.eject(id);
				this.teamClient.interceptors.response.eject(id);
			});
			this._interceptors = [];
		}

		let organization = encodeURIComponent(config.organization!);
		let project = encodeURIComponent(config.project!);
		let team = encodeURIComponent(config.team!);

		const clientFactory = (baseUrl: string) => {
			const client = axios.create({
				baseURL: baseUrl,
				auth: {
					username: "PAT",
					password: config.token || ""
				},
				headers: {
					'Accept': 'application/json; api-version=5.0'
				},
				validateStatus: status => status === 200
			});

			if (config.debug) {
				const id = client.interceptors.response.use(
					res => this.logRequest(res.request, res),
					err => this.logRequest(err.request, Promise.reject(err))
				);
				this._interceptors.push(id);
			}

			return client;
		};

		this.client = clientFactory(`https://dev.azure.com/${organization}/${project}/_apis/`);
		this.teamClient = clientFactory(`https://dev.azure.com/${organization}/${project}/${team}/_apis/`);
	}

	private logRequest(request: any, returnValue: any) {
		console.log(`[DEBUG] ${request.method!.toUpperCase()} ${request.path}`);
		return returnValue;
	}

	public async getIterationsInfo(): Promise<IterationInfo[]> {
		const finish = this.logger.perf('Getting iterations info...');
		const result = await this.teamClient.get<IterationsResult>("/work/teamsettings/iterations");
		finish();

		if (result.data.count > 0) {
			let iterations: IterationInfo[] = [];
			result.data.value.forEach(element => {
				const iteration = <IterationInfo>{
					id: element.id,
					name: element.name,
					path: element.path
				};
				iterations.push(iteration);
			});

			return iterations;

		}

		throw new Error("Iterations not found");
  }

	public async getCurrentIterationInfo(): Promise<IterationInfo> {
		const finish = this.logger.perf('Getting current iteration info...');
		const result = await this.teamClient.get<IterationsResult>("/work/teamsettings/iterations?$timeframe=current");
		finish();

		if (result.data.count > 0) {
			const iteration = result.data.value[0];
			return <IterationInfo>{
				id: iteration.id,
				name: iteration.name,
				path: iteration.path
			};
		}

		throw new Error("Current iteration not found");
	}

	public async getIterationWorkItems(iterationId: string): Promise<UserStoryIdentifier[]> {
		const finish = this.logger.perf('Getting user stories for iteration...');
		const result = await this.teamClient.get<IterationWorkItemsResult>(`/work/teamsettings/iterations/${iterationId}/workitems`, {
			params: {
				...this._apiVersionPreview
			}
		});

		finish();

		return result.data.workItemRelations.filter(x => x.rel === null).map(x => (
			<UserStoryIdentifier>{
				id: x.target.id,
				url: x.target.url
			}
		));
	}

	public async getActivityTypes(): Promise<string[]> {
		const finish = this.logger.perf('Getting activity types...');
		const result = await this.client.get<FieldDefinition>(`/wit/workitemtypes/Task/fields/Microsoft.VSTS.Common.Activity?$expand=All`);

		finish();

		return result.data.allowedValues;
	}

	public async getUserStoryInfo(userStoryIds: number[]): Promise<UserStoryInfo[]> {
		const finish = this.logger.perf('Getting user story info...');

		const params = <any>{
			ids: userStoryIds.join(','),
			'$expand': 'Relations'
		};

		const result = await this.client.get<WorkItemInfoResult>('/wit/workitems', { params });
		finish();

		return result.data.value
			.filter(x => x.fields["System.WorkItemType"] === "User Story")
			.map(x => (<UserStoryInfo>{
				id: x.id,
				url: x.url,
				title: x.fields["System.Title"],
				areaPath: x.fields["System.AreaPath"],
				teamProject: x.fields["System.TeamProject"],
				iterationPath: x.fields["System.IterationPath"],
				taskUrls: (x.relations) && x.relations.filter(r => r.rel === 'System.LinkTypes.Hierarchy-Forward').map(r => r.url) || []
			}));
	}

	public async getMaxTaskStackRank(taskIds: number[]): Promise<number> {
		if (taskIds.length === 0) {
			this.logger.log('No tasks in User Story -> Stack Rank = 0');
			return 0;
		}

    	const finish = this.logger.perf('Getting max stack rank for tasks...');

		const params = <any>{
			ids: taskIds.join(','),
			fields: ['Microsoft.VSTS.Common.StackRank'].join(',')
		};

		const result = await this.client.get<WorkItemInfoResult>('/wit/workitems', { params });
		const stackRanks = result.data.value.map(t => t.fields["Microsoft.VSTS.Common.StackRank"]);

		finish();

		const max = stackRanks.reduce((acc, current) => {
			acc = Math.max(acc, current || 0);
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
		};
	}

	private userStoryLink(url: string) {
		return {
			rel: "System.LinkTypes.Hierarchy-Reverse",
			url
		};
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
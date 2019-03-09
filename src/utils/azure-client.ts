import axios, { AxiosInstance } from 'axios';
import prettyHrtime = require('pretty-hrtime');

import { IterationsResult } from '../models/azure-client/iterations';
import { IterationWorkItemsResult } from '../models/azure-client/iterationsWorkItems';
import { WorkItemInfoResult, WorkItemCreatedResponse } from '../models/azure-client/workItems';
import { Logger } from './logger';

export class AzureClient {

	private _baseUrl: string = "https://dev.azure.com/ipatalas0593/IDEAapp_2018/_apis/";
	private _token: string = "drblkz22762qjczvs4vmgafobruj2kttgtjli3phh3hmsdi4nojq";
	private _apiVersionPreview = {
		'api-version': '5.0-preview.1'
	}

	client: AxiosInstance;

	constructor(private logger: Logger) {
		this.client = axios.create({
			baseURL: this._baseUrl,
			auth: {
				username: "PAT",
				password: this._token
			},
			params: {
				'api-version': "5.0"
			}
		});
	}

	public async getCurrentIterationInfo(): Promise<IterationInfo> {
		this.logger.log('Getting current iteration info...');

		const result = await this.client.get<IterationsResult>("/work/teamsettings/iterations?$timeframe=current");

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
		this.logger.log('Getting user stories for iteration...');

		const result = await this.client.get<IterationWorkItemsResult>(`/work/teamsettings/iterations/${iterationId}/workitems`, {
			params: {
				...this._apiVersionPreview
			}
		});

		return result.data.workItemRelations.filter(x => x.rel == null).map(x => (
			<UserStoryIdentifier>{
				id: x.target.id,
				url: x.target.url
			}
		));
	}

	public async getUserStoryInfo(userStoryIds: number[]): Promise<UserStoryInfo[]> {
		this.logger.log('Getting user story info...');

		const result = await this.client.get<WorkItemInfoResult>('/wit/workitems', {
			params: {
				ids: userStoryIds.join(','),
				fields: ['System.Title', 'System.AreaPath', 'System.TeamProject', 'System.IterationPath'].join(',')
			}
		});

		return result.data.value.map(x => (
			<UserStoryInfo>{
				id: x.id,
				url: x.url,
				title: x.fields["System.Title"],
				areaPath: x.fields["System.AreaPath"],
				teamProject: x.fields["System.TeamProject"],
				iterationPath: x.fields["System.IterationPath"],
			}
		));
	}

	public createTask(task: TaskInfo): Promise<number> {
		const request = [
			this.addOperation('/fields/System.Title', task.title),
			this.addOperation('/fields/System.AreaPath', task.areaPath),
			this.addOperation('/fields/System.TeamProject', task.teamProject),
			this.addOperation('/fields/System.IterationPath', task.iterationPath),
			this.addOperation('/fields/Microsoft.VSTS.Common.Activity', task.activity),
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
		let time = process.hrtime();

		return this.client.post<WorkItemCreatedResponse>(
			'/wit/workitems/$Task', request, {
				headers: {
					'Content-Type': 'application/json-patch+json'
				}
			}).then(res => {
				time = process.hrtime(time);
				this.logger.log(`#${res.data.id} Task '${task.title}' created (${prettyHrtime(time)})`);
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
}
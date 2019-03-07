import axios, { AxiosInstance } from 'axios';
import { IterationsResult } from '../models/azure-client/iterations';
import { IterationWorkItemsResult } from '../models/azure-client/iterationsWorkItems';
import { WorkItemInfoResult } from '../models/azure-client/workItems';

export class AzureClient {

	private _baseUrl: string = "https://dev.azure.com/ipatalas0593/IDEAapp_2018/_apis/";
	private _token: string = "drblkz22762qjczvs4vmgafobruj2kttgtjli3phh3hmsdi4nojq";
	private _apiVersionPreview = {
		'api-version': '5.0-preview.1'
	}

	client: AxiosInstance;

	constructor() {
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
		const result = await this.client.get<WorkItemInfoResult>('/wit/workitems', {
			params: {
				ids: userStoryIds.join(','),
				fields: ['System.Title', 'System.AreaPath', 'System.TeamProject', 'System.IterationPath'].join(',')
			}
		});

		return result.data.value.map(x => (
			<UserStoryInfo>{
				id: x.id,
				title: x.fields["System.Title"],
				areaPath: x.fields["System.AreaPath"],
				teamProject: x.fields["System.TeamProject"],
				iterationPath: x.fields["System.IterationPath"],
			}
		));
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
	title: string;
	areaPath: string;
	teamProject: string;
	iterationPath: string;
}
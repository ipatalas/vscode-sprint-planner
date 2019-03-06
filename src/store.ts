import * as prettyHrTime from 'pretty-hrtime';
import * as vsc from 'vscode';
import { UserStoryInfo, AzureClient, IterationInfo } from './utils/azure-client';

export class SessionStore implements ISessionStore {
	public currentIteration!: IterationInfo;
	public userStories?: UserStoryInfo[] = undefined;

	constructor(private azureClient: AzureClient) {
	}

	async ensureHasUserStories(): Promise<void> {
		if (this.currentIteration && this.userStories !== undefined) {
			return Promise.resolve();
		}

		let total = process.hrtime();
		this.currentIteration = await this.azureClient.getCurrentIterationInfo();
		const usIdentifiers = await this.azureClient.getIterationUserStories(this.currentIteration.id);
		this.userStories = await this.azureClient.getUserStoryInfo(usIdentifiers.map(x => x.id));

		total = process.hrtime(total);
		vsc.window.setStatusBarMessage(`User stories fetched in ${prettyHrTime(total)} (3 requests)`, 2000);

		return Promise.resolve();
	}
}

export interface ISessionStore {
	readonly userStories?: UserStoryInfo[];

	ensureHasUserStories(): Promise<void>;
}

import * as vsc from 'vscode';
import { UserStoryInfo, AzureClient, IterationInfo } from './utils/azure-client';
import { Logger } from './utils/logger';
import { Stopwatch } from './utils/stopwatch';

export class SessionStore implements ISessionStore {
	public currentIteration!: IterationInfo;
	public userStories?: UserStoryInfo[] = undefined;

	constructor(private azureClient: AzureClient, private logger: Logger) {
	}

	async ensureHasUserStories(): Promise<void> {
		if (this.currentIteration && this.userStories !== undefined) {
			return Promise.resolve();
		}

		try {
			let total = Stopwatch.startNew();
			this.currentIteration = await this.azureClient.getCurrentIterationInfo();
			const usIdentifiers = await this.azureClient.getIterationUserStories(this.currentIteration.id);
			this.userStories = await this.azureClient.getUserStoryInfo(usIdentifiers.map(x => x.id));
			total.stop();

			this.logger.log(`User stories fetched in ${total.toString()} (3 requests)`);
			vsc.window.setStatusBarMessage(`User stories fetched in ${total.toString()} (3 requests)`, 2000);
		} catch (err) {
			this.logger.log(`[Error] ${err.message}`);
			this.logger.log(`[Error] ${err.response.data.message}`);
			return Promise.reject();
		}

		return Promise.resolve();
	}
}

export interface ISessionStore {
	readonly userStories?: UserStoryInfo[];

	ensureHasUserStories(): Promise<void>;
}

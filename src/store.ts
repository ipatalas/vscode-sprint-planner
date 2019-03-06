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

		this.currentIteration = await this.azureClient.getCurrentIterationInfo();
		const usIdentifiers = await this.azureClient.getIterationUserStories(this.currentIteration.id);
		this.userStories = await this.azureClient.getUserStoryInfo(usIdentifiers.map(x => x.id));

		return Promise.resolve();
	}
}

export interface ISessionStore {
	readonly userStories?: UserStoryInfo[];

	ensureHasUserStories(): Promise<void>;
}

import * as vsc from 'vscode';
import { ISessionStore } from '../store';
import { UserStoryPrefix } from '../constants';

export class UserStoryCompletionProvider implements vsc.CompletionItemProvider {
	constructor(private sessionStore: ISessionStore) {
	}

	async provideCompletionItems(document: vsc.TextDocument, position: vsc.Position, token: vsc.CancellationToken, context: vsc.CompletionContext) {
		const range = new vsc.Range(
			new vsc.Position(position.line, position.character - UserStoryPrefix.length),
			position
		);

		const text = document.getText(range);

		if (text == UserStoryPrefix) {
			await this.sessionStore.ensureHasUserStories();

			if (this.sessionStore.userStories) {
				return this.sessionStore.userStories.map(us => {
					const item = new vsc.CompletionItem(`${us.id} - ${us.title}`, vsc.CompletionItemKind.Unit);
					item.sortText = us.title;

					return item;
				});
			}
		}

		return [];
	}
}

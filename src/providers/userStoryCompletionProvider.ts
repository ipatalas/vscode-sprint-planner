import * as vsc from 'vscode';
import { ISessionStore } from '../store';
import { UserStoryPrefix } from '../constants';
import { Logger } from '../utils/logger';

export class UserStoryCompletionProvider implements vsc.CompletionItemProvider {
	constructor(private sessionStore: ISessionStore, private logger: Logger) {
	}

	async provideCompletionItems(document: vsc.TextDocument, position: vsc.Position, token: vsc.CancellationToken, context: vsc.CompletionContext) {
		const range = new vsc.Range(
			new vsc.Position(position.line, position.character - UserStoryPrefix.length),
			position
		);

		const text = document.getText(range);

		if (text == UserStoryPrefix) {
			try {
				await this.sessionStore.ensureHasUserStories();

				if (this.sessionStore.userStories) {
					return this.sessionStore.userStories.map(us => {
						const item = new vsc.CompletionItem(`${us.id} - ${us.title}`, vsc.CompletionItemKind.Class);
						item.sortText = us.title;

						return item;
					});
				}
			} catch (err) {
				if (typeof err === 'string') {
					vsc.window.showErrorMessage(err);
				} else if (err) {
					this.logger.log(JSON.stringify(err));
				}
			}
		}

		return [];
	}
}

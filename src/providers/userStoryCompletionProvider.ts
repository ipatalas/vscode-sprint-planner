import * as vsc from 'vscode';
import { ISessionStore } from '../store';
import { UserStoryPrefix } from '../constants';
import { Logger } from '../utils/logger';
import { Document } from '../utils/document';

export class UserStoryCompletionProvider implements vsc.CompletionItemProvider {
	constructor(private sessionStore: ISessionStore, private logger: Logger) {
	}

	async provideCompletionItems(document: vsc.TextDocument, position: vsc.Position, _token: vsc.CancellationToken, _context: vsc.CompletionContext) {
		const text = Document.getTextBeforeCursor(document, position);

		if (text === UserStoryPrefix) {
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
				if (err) {
					vsc.window.showErrorMessage(err.message);
					this.logger.log(err);
				}
			}
		}

		return [];
	}
}

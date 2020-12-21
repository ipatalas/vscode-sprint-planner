import * as vsc from 'vscode';
import { ISessionStore } from '../store';
import { IterationPrefix } from '../constants';
import { Logger } from '../utils/logger';
import { Document } from '../utils/document';

export class IterationCompletionProvider implements vsc.CompletionItemProvider {
	constructor(private sessionStore: ISessionStore, private logger: Logger) {
	}

	async provideCompletionItems(document: vsc.TextDocument, position: vsc.Position, _token: vsc.CancellationToken, _context: vsc.CompletionContext): Promise<vsc.CompletionItem[]> {
		const text = Document.getTextBeforeCursor(document, position);

		if (text === IterationPrefix) {
			try {
				await this.sessionStore.ensureHasIterations();

				if (this.sessionStore.iterations) {
					return this.sessionStore.iterations.map(it => {
						const item = new vsc.CompletionItem(`${it.name} - (${it.path})`, vsc.CompletionItemKind.Class);
						item.insertText = `${it.id} - ${it.name} - (${it.path})`;
						item.sortText = it.path;

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

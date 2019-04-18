import * as vsc from 'vscode';
import { ISessionStore } from '../store';
import { IterationPrefix } from '../constants';
import { Logger } from '../utils/logger';

export class IterationCompletionProvider implements vsc.CompletionItemProvider {
	constructor(private sessionStore: ISessionStore, private logger: Logger) {
	}

	async provideCompletionItems(document: vsc.TextDocument, position: vsc.Position, token: vsc.CancellationToken, context: vsc.CompletionContext) {
		const range = new vsc.Range(
			new vsc.Position(position.line, position.character - IterationPrefix.length),
			position
		);

		const text = document.getText(range);

		if (text === IterationPrefix) {
			try {
				await this.sessionStore.ensureHasIterations();

				if (this.sessionStore.iterations) {
					return this.sessionStore.iterations.map(it => {
						const item = new vsc.CompletionItem(`${it.id} - ${it.name} - (${it.path})`, vsc.CompletionItemKind.Class);
						item.sortText = it.path;

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

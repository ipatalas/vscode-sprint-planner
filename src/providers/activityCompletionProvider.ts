import * as vsc from 'vscode';
import { ISessionStore } from '../store';
import { Logger } from '../utils/logger';
import { ActivityTypeTriggerRegex } from '../constants';
import { Document } from '../utils/document';

export class ActivityCompletionProvider implements vsc.CompletionItemProvider {
	constructor(private sessionStore: ISessionStore, private logger: Logger) {
	}

	async provideCompletionItems(document: vsc.TextDocument, position: vsc.Position, _token: vsc.CancellationToken, _context: vsc.CompletionContext) {
		const text = Document.getTextBeforeCursor(document, position);
		const word = document.getText(document.getWordRangeAtPosition(position, /\w*:/));

		if (ActivityTypeTriggerRegex.test(text)) {
			try {
				await this.sessionStore.ensureHasActivityTypes();

				if (this.sessionStore.activityTypes) {
					return this.sessionStore.activityTypes.map(activity => {
						const item = new vsc.CompletionItem(activity, vsc.CompletionItemKind.TypeParameter);
						item.insertText = `${activity}:`;

						if (word.endsWith(':')) {
							const currentLine = document.lineAt(position.line);

							item.additionalTextEdits = [
								vsc.TextEdit.delete(new vsc.Range(position, position.with(undefined, currentLine.text.length)))
							];
						}

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

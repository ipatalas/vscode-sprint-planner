import * as vsc from 'vscode';
import { SnippetTriggerRegex } from '../constants';
import { Document } from '../utils/document';
import { Configuration } from '../utils/config';

export class SnippetCompletionProvider implements vsc.CompletionItemProvider {
	constructor(private config: Configuration) {
	}

	provideCompletionItems(document: vsc.TextDocument, position: vsc.Position, _token: vsc.CancellationToken, _context: vsc.CompletionContext) {
		const text = Document.getTextBeforeCursor(document, position);

		if (this.config.snippets && SnippetTriggerRegex.test(text)) {
			return Object.keys(this.config.snippets).map(name => {
				const item = new vsc.CompletionItem(name, vsc.CompletionItemKind.Snippet);
				item.detail = "Tasks snippet";
				item.insertText = this.config.snippets![name];
				item.documentation = item.insertText;

				return item;
			});
		}

		return [];
	}
}

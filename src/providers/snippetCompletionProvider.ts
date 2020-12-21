import * as vsc from 'vscode';
import { SnippetTriggerRegex } from '../constants';
import { Document } from '../utils/document';
import { Configuration } from '../utils/config';

export class SnippetCompletionProvider implements vsc.CompletionItemProvider {
	constructor(private config: Configuration) {
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	provideCompletionItems(document: vsc.TextDocument, position: vsc.Position, _token: vsc.CancellationToken, _context: vsc.CompletionContext): vsc.CompletionItem[] {
		const text = Document.getTextBeforeCursor(document, position);

		if (this.config && this.config.snippets && SnippetTriggerRegex.test(text)) {
			return Object.entries(this.config.snippets).map(([name, value]) => {
				const item = new vsc.CompletionItem(name, vsc.CompletionItemKind.Snippet);
				item.detail = "Tasks snippet";
				item.insertText = value;
				item.documentation = item.insertText;

				return item;
			});
		}

		return [];
	}
}

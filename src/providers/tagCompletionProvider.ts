import * as vsc from 'vscode';
import { ISessionStore } from '../store';
import { TagRegex } from '../constants';
import { Logger } from '../utils/logger';
import { Document } from '../utils/document';

export class TagCompletionProvider implements vsc.CompletionItemProvider {
    constructor(private sessionStore: ISessionStore, private logger: Logger) {
    }

    async provideCompletionItems(document: vsc.TextDocument, position: vsc.Position, _token: vsc.CancellationToken, _context: vsc.CompletionContext): Promise<vsc.CompletionItem[]> {
        const text = Document.getTextBeforeCursor(document, position);

        if (TagRegex.test(text)) {
            try {
                await this.sessionStore.ensureHasTags();

                if (this.sessionStore.tags) {
                    return this.sessionStore.tags.map(tag => {
                        const item = new vsc.CompletionItem(`${tag}`, vsc.CompletionItemKind.Class);
                        item.insertText = `${tag}`;
                        item.sortText = tag;

                        return item;
                    });
                }
            } catch (err) {
                if (err && err instanceof Error) {
                    vsc.window.showErrorMessage(err.message);
                    this.logger.log(err.message);
                }
            }
        }

        return [];
    }
}

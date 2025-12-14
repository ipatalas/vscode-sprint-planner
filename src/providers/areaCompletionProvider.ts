import * as vsc from 'vscode';
import { ISessionStore } from '../store';
import { AreaPrefix } from '../constants';
import { Logger } from '../utils/logger';
import { Document } from '../utils/document';

export class AreaCompletionProvider implements vsc.CompletionItemProvider {
    constructor(private sessionStore: ISessionStore, private logger: Logger) {
    }

    async provideCompletionItems(document: vsc.TextDocument, position: vsc.Position, _token: vsc.CancellationToken, _context: vsc.CompletionContext): Promise<vsc.CompletionItem[]> {
        const text = Document.getTextBeforeCursor(document, position);

        if (text.startsWith(AreaPrefix)) {
            try {
                await this.sessionStore.ensureHasAreas();

                if (this.sessionStore.areas) {
                    return this.sessionStore.areas.map(area => {
                        const item = new vsc.CompletionItem(area, vsc.CompletionItemKind.Enum);
                        item.range = new vsc.Range(new vsc.Position(position.line, AreaPrefix.length), position);

                        return item;
                    });
                }
            } catch (err) {
                if (err instanceof Error) {
                    vsc.window.showErrorMessage(err.message);
                    this.logger.log(err.message);
                }
            }
        }

        return [];
    }
}
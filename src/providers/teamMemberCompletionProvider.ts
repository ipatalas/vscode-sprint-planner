import * as vsc from 'vscode';
import { ISessionStore } from '../store';
import { TeamMemberRegex } from '../constants';

import { Logger } from '../utils/logger';
import { Document } from '../utils/document';

export class TeamMemberCompletionProvider implements vsc.CompletionItemProvider {
    constructor(private sessionStore: ISessionStore, private logger: Logger) {
    }

    async provideCompletionItems(document: vsc.TextDocument, position: vsc.Position, _token: vsc.CancellationToken, _context: vsc.CompletionContext): Promise<vsc.CompletionItem[]> {
        const text = Document.getTextBeforeCursor(document, position);

        if (TeamMemberRegex.test(text)) {
            try {
                await this.sessionStore.ensureHasTeamMembers();

                if (this.sessionStore.teamMembers) {
                    return this.sessionStore.teamMembers.map(tm => {
                        const item = new vsc.CompletionItem(`${tm.email} - [${tm.displayName}]`, vsc.CompletionItemKind.Class);
                        item.insertText = `${tm.email}`;
                        item.sortText = tm.id;

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

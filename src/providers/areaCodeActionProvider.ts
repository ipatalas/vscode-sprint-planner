import * as vsc from 'vscode';
import didYouMean, { ReturnTypeEnums } from 'didyoumean2';

import { ISessionStore } from '../store';
import { Diagnostics } from '../constants';

export class AreaCodeActionProvider implements vsc.CodeActionProvider {
    constructor(private store: ISessionStore) {
    }

    provideCodeActions(document: vsc.TextDocument, range: vsc.Range | vsc.Selection, context: vsc.CodeActionContext, _token: vsc.CancellationToken): vsc.ProviderResult<(vsc.Command | vsc.CodeAction)[]> {
        const diag = context.diagnostics.find(d => d.code?.toString().startsWith(Diagnostics.InvalidArea) && d.range.contains(range));

        if (diag) {
            return this.getCodeActions(document, diag);
        }

        return [];
    }

    private async getCodeActions(document: vsc.TextDocument, diag: vsc.Diagnostic) {
        await this.store.ensureHasAreas();

        const [, area] = (diag.code as string).split(':', 2);

        const result = didYouMean(area, this.store.areas || [], { returnType: ReturnTypeEnums.ALL_SORTED_MATCHES }) as string[];
        if (result?.length) {
            const rangeToReplace = diag.range;

            return result.slice(0, 2).map(r => {
                const edit = new vsc.WorkspaceEdit();
                edit.replace(document.uri, rangeToReplace, r);

                const action = new vsc.CodeAction(`Did you mean '${r}'?`, vsc.CodeActionKind.QuickFix);
                action.diagnostics = [diag];
                action.edit = edit;

                return action;
            });
        }

        return [];
    }

}
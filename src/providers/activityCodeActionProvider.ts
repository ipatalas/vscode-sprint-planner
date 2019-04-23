import * as vsc from 'vscode';
import didYouMean from 'didyoumean2';

import { ISessionStore } from '../store';
import { Logger } from '../utils/logger';

export class ActivityCodeActionProvider implements vsc.CodeActionProvider {
	constructor(private store: ISessionStore, private logger: Logger) {
	}

	provideCodeActions(document: vsc.TextDocument, range: vsc.Range | vsc.Selection, context: vsc.CodeActionContext, _token: vsc.CancellationToken): vsc.ProviderResult<(vsc.Command | vsc.CodeAction)[]> {
		const diag = context.diagnostics.find(d => d.range.contains(range));

		if (diag) {
			return this.getCodeActions(document, diag);
		}

		return [];
	}

	private async getCodeActions(document: vsc.TextDocument, diag: vsc.Diagnostic) {
		await this.store.ensureHasActivityTypes();

		const result = didYouMean(diag.code as string, this.store.activityTypes || []);
		if (result) {
			const rangeToReplace = diag.range;

			const edit = new vsc.WorkspaceEdit();
			edit.replace(document.uri, rangeToReplace, result as string);

			const action = new vsc.CodeAction(`Did you mean '${result}'?`, vsc.CodeActionKind.QuickFix);
			action.diagnostics = [diag];
			action.edit = edit;
			return [action];
		}

		return [];
	}

}
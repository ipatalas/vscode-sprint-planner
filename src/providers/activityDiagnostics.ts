import * as vsc from 'vscode';
import { LanguageId, NewLineRegex } from '../constants';
import { ISessionStore } from '../store';
import debounce from '../utils/debounce';

export class ActivityDiagnostics implements vsc.Disposable {
	private collection: vsc.DiagnosticCollection;
	private handler?: vsc.Disposable;

	constructor(private store: ISessionStore) {
		this.collection = vsc.languages.createDiagnosticCollection('activity-diagnostics');
	}

	dispose() {
		// tslint:disable: no-unused-expression
		this.collection && this.collection.dispose();
		this.handler && this.handler.dispose();
		// tslint:enable: no-unused-expression
	}

	register() {
		this.handler = vsc.workspace.onDidChangeTextDocument(debounce(this.documentChanged.bind(this), 250));

		if (vsc.window.activeTextEditor) {
			const isPlannerFile = vsc.window.activeTextEditor.document && vsc.window.activeTextEditor.document.languageId === LanguageId;
			if (isPlannerFile) {
				this.refresh(vsc.window.activeTextEditor.document);
			}
		}
	}

	private async documentChanged(e: vsc.TextDocumentChangeEvent) {
		const isPlannerFile = e.document && e.document.languageId === LanguageId;
		if (!isPlannerFile) {
			return;
		}

		await this.refresh(e.document);
	}

	async refresh(document: vsc.TextDocument) {
		await this.store.ensureHasActivityTypes();

		this.collection.clear();

		const activities = this.store.activityTypes || [];

		const lines = document.getText().split(NewLineRegex);
		const diagnostics: vsc.Diagnostic[] = [];

		for	(let i = 0; i < lines.length; i++) {
			const match = /^(\w+):/.exec(lines[i]);

			if (match) {
				const activity = match[1];

				if (!activities.includes(activity)) {
					const range = new vsc.Range(i, 0, i, activity.length);
					const diagnostic = new vsc.Diagnostic(range, `${activity} is not a valid Activity`);
					diagnostic.code = activity;
					diagnostics.push(diagnostic);
				}
			}
		}

		this.collection.set(document.uri, diagnostics);
	}
}
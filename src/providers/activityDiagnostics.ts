import * as vsc from 'vscode';
import { LanguageId, NewLineRegex } from '../constants';
import { ISessionStore } from '../store';
import debounce from '../utils/debounce';
import { TextProcessor } from '../utils/textProcessor';
import { UserStory } from '../models/task';

export class ActivityDiagnostics implements vsc.Disposable {
	private collection: vsc.DiagnosticCollection;
	private handler?: vsc.Disposable;
	private decorations: vsc.TextEditorDecorationType[] = [];

	constructor(private store: ISessionStore) {
		this.collection = vsc.languages.createDiagnosticCollection('activity-diagnostics');
	}

	dispose() {
		// tslint:disable: no-unused-expression
		this.collection && this.collection.dispose();
		this.handler && this.handler.dispose();
		// tslint:enable: no-unused-expression
		this.decorations.forEach(d => d.dispose());
	}

	register() {
		this.handler = vsc.workspace.onDidChangeTextDocument(debounce(this.documentChanged.bind(this), 350));

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
		this.decorations.forEach(d => d.dispose());
		this.decorations = [];

		const activities = this.store.activityTypes || [];

		const lines = document.getText().split(NewLineRegex);
		const diagnostics: vsc.Diagnostic[] = [];
		const textEditor = vsc.window.activeTextEditor;

		const userStoryLines = TextProcessor.getUserStoryLineIndices(lines);
		const userStories = userStoryLines.map(usLine => TextProcessor.getUserStory(lines, usLine)!);

		for (let line = 0; line < lines.length; line++) {
			const match = /^(\w+):$/.exec(lines[line]);

			if (match) {
				const activity = match[1];

				if (!activities.includes(activity)) {
					const range = new vsc.Range(line, 0, line, activity.length);
					const diagnostic = new vsc.Diagnostic(range, `${activity} is not a valid Activity`);
					diagnostic.code = activity;
					diagnostics.push(diagnostic);
				} else if (textEditor) {
					let userStory = this.findUserStory(userStories, line);
					if (userStory) {
						const decoration = this.createActivityDecoration(userStory, activity);
						const range = new vsc.Range(line, 0, line, activity.length + 1);

						this.decorations.push(decoration);
						textEditor.setDecorations(decoration, [range]);
					}
				}
			}
		}

		this.collection.set(document.uri, diagnostics);
	}

	private findUserStory(userStories: UserStory[], line: number) {
		for (let i = userStories.length - 1; i >= 0; i--) {
			if (userStories[i].line < line) {
				return userStories[i];
			}
		}
	}

	private createActivityDecoration(userStory: UserStory, activity: string) {
		const stats = userStory.tasks.filter(t => t.activity === activity).reduce((acc, task) => {
			acc.tasks++;
			acc.hours += task.estimation || 0;
			return acc;
		}, {
			tasks: 0,
			hours: 0
		});

		const totalHours = userStory.tasks.reduce((acc, task) => {
			acc += task.estimation || 0;
			return acc;
		}, 0);

		const percentage = Math.floor(stats.hours * 100 / totalHours);

		return vsc.window.createTextEditorDecorationType({
			isWholeLine: true,
			after: {
				contentText: `${stats.tasks} tasks (${stats.hours}h - ${percentage}% of US)`,
				margin: "0 0 0 10px",
				fontStyle: "italic",
				color: new vsc.ThemeColor("editorCodeLens.foreground")
			}
		});
	}
}
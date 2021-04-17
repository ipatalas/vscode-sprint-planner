import * as vsc from 'vscode';
import { AreaPrefix, Diagnostics, LanguageId, NewLineRegex } from '../constants';
import { ISessionStore } from '../store';
import debounce from '../utils/debounce';
import { TextProcessor } from '../utils/textProcessor';

export class AreaDiagnostics implements vsc.Disposable {
    private collection: vsc.DiagnosticCollection;
    private handler?: vsc.Disposable;
    private decorations: vsc.TextEditorDecorationType[] = [];

    constructor(private store: ISessionStore) {
        this.collection = vsc.languages.createDiagnosticCollection('area-diagnostics');
    }

    dispose(): void {
        this.collection && this.collection.dispose();
        this.handler && this.handler.dispose();
        this.decorations.forEach(d => d.dispose());
    }

    register(): void {
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

    async refresh(document: vsc.TextDocument): Promise<void> {
        await this.store.ensureHasAreas();

        this.collection.clear();
        this.decorations.forEach(d => d.dispose());
        this.decorations = [];

        const validAreas = this.store.areas || [];

        const allLines = document.getText().split(NewLineRegex);
        const diagnostics: vsc.Diagnostic[] = [];

        const areaLines = TextProcessor.getAreasIndices(allLines);
        const areas = areaLines.map(line => TextProcessor.getAreaName(allLines, line));

        for (let i = 0; i < areas.length; i++) {
            const area = areas[i];
            if (!validAreas.includes(area)) {
                const line = areaLines[i];
                const range = new vsc.Range(line, AreaPrefix.length, line, AreaPrefix.length + area.length);
                const diagnostic = new vsc.Diagnostic(range, `${area} is not a valid area`);
                diagnostic.code = `${Diagnostics.InvalidArea}:${area}`;
                diagnostics.push(diagnostic);
            }
        }

        this.collection.set(document.uri, diagnostics);
    }
}
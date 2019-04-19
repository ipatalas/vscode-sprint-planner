import * as vsc from 'vscode';

export class Document {
	public static getTextBeforeCursor(document: vsc.TextDocument, position: vsc.Position) {
		const range = new vsc.Range(
			new vsc.Position(position.line, 0),
			position
		);

		return document.getText(range);
	}
}
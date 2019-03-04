// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vsc from 'vscode';
import { publish as publish_command } from './commands/publish';

const documentSelector = [
	{ language: 'planner', scheme: 'file' },
	{ language: 'planner', scheme: 'untitled' },
];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vsc.ExtensionContext) {
	let disposable = vsc.commands.registerCommand('sprintplanner.publish', () => publish_command());

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vsc from 'vscode';
import { publish as publish_command } from './commands/publish';
import { UserStoryCompletionProvider } from './providers/userStoryCompletionProvider';
import { SessionStore } from './store';
import { AzureClient } from './utils/azure-client';
import { Commands } from './constants';
import { PublishCodeLensProvider } from './providers/publishCodeLensProvider';

const documentSelector = [
	{ language: 'planner', scheme: 'file' },
	{ language: 'planner', scheme: 'untitled' },
];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vsc.ExtensionContext) {
	const azureClient = new AzureClient();
	const sessionStore = new SessionStore(azureClient);

	context.subscriptions.push(vsc.commands.registerCommand(Commands.publish, (line: number) => publish_command(line)));
	context.subscriptions.push(vsc.languages.registerCompletionItemProvider(documentSelector, new UserStoryCompletionProvider(sessionStore), '#'));
	context.subscriptions.push(vsc.languages.registerCodeLensProvider(documentSelector, new PublishCodeLensProvider()));
}

// this method is called when your extension is deactivated
export function deactivate() {}

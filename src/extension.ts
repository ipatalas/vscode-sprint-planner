// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vsc from 'vscode';
import { PublishCommand } from './commands/publish';
import { UserStoryCompletionProvider } from './providers/userStoryCompletionProvider';
import { SessionStore } from './store';
import { AzureClient } from './utils/azure-client';
import { Commands } from './constants';
import { PublishCodeLensProvider } from './providers/publishCodeLensProvider';
import { Logger } from './utils/logger';

const documentSelector = [
	{ language: 'planner', scheme: 'file' },
	{ language: 'planner', scheme: 'untitled' },
];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vsc.ExtensionContext) {
	const logger = new Logger();
	const azureClient = new AzureClient(logger);
	const sessionStore = new SessionStore(azureClient, logger);

	const publishCommand = new PublishCommand(sessionStore, azureClient);

	context.subscriptions.push(logger);
	context.subscriptions.push(vsc.commands.registerCommand(Commands.publish, publishCommand.publish, publishCommand));
	context.subscriptions.push(vsc.languages.registerCompletionItemProvider(documentSelector, new UserStoryCompletionProvider(sessionStore), '#'));
	context.subscriptions.push(vsc.languages.registerCodeLensProvider(documentSelector, new PublishCodeLensProvider()));
}

// this method is called when your extension is deactivated
export function deactivate() {}

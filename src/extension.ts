// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vsc from 'vscode';
import { PublishCommand } from './commands/publish';
import { IterationCompletionProvider } from './providers/iterationCompletionProvider';
import { UserStoryCompletionProvider } from './providers/userStoryCompletionProvider';
import { SessionStore } from './store';
import { AzureClient } from './utils/azure-client';
import { Commands, LanguageId } from './constants';
import { UserStoryCodeLensProvider } from './providers/userStoryCodeLensProvider';
import { Logger } from './utils/logger';
import { Configuration } from './utils/config';
import { ActivityCompletionProvider } from './providers/activityCompletionProvider';
import { ActivityDiagnostics } from './providers/activityDiagnostics';
import { ActivityCodeActionProvider } from './providers/activityCodeActionProvider';
import { SnippetCompletionProvider } from './providers/snippetCompletionProvider';
import { WorkItemRequestBuilder } from './utils/workItemRequestBuilder';
import { WorkItemLinkProvider } from './providers/workItemLinkProvider';
import { SyncTasksCommand } from './commands/syncTasks';
import { AreaCompletionProvider } from './providers/areaCompletionProvider';
import { AreaDiagnostics } from './providers/areaDiagnostics';
import { AreaCodeActionProvider } from './providers/areaCodeActionProvider';
import { TeamMemberCompletionProvider } from './providers/teamMemberCompletionProvider';
import { TagCompletionProvider } from './providers/tagCompletionProvider';

const documentSelector = [
	{ language: LanguageId, scheme: 'file' },
	{ language: LanguageId, scheme: 'untitled' },
];

export function activate(context: vsc.ExtensionContext): void {
	const workItemRequestBuilder = new WorkItemRequestBuilder();
	const logger = new Logger();
	const config = new Configuration(logger);
	const azureClient = new AzureClient(config, logger, workItemRequestBuilder);
	const sessionStore = new SessionStore(azureClient, config, logger);

	const publishCommand = new PublishCommand(sessionStore, azureClient, logger, config);
	const syncTasksCommand = new SyncTasksCommand(azureClient, logger, config);

	const alphabet = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'];

	const activityDiagnostics = new ActivityDiagnostics(sessionStore);
	activityDiagnostics.register();

    const areaDiagnostics = new AreaDiagnostics(sessionStore);
    areaDiagnostics.register();

	context.subscriptions.push(...[
		logger,
		config,
		vsc.commands.registerCommand(Commands.publish, publishCommand.publish, publishCommand),
		vsc.commands.registerCommand(Commands.syncTasks, syncTasksCommand.sync, syncTasksCommand),
		vsc.languages.registerCompletionItemProvider(documentSelector, new ActivityCompletionProvider(sessionStore, logger), ...alphabet),
		vsc.languages.registerCompletionItemProvider(documentSelector, new SnippetCompletionProvider(config), ...alphabet),
		vsc.languages.registerCompletionItemProvider(documentSelector, new IterationCompletionProvider(sessionStore, logger), '#'),
		vsc.languages.registerCompletionItemProvider(documentSelector, new UserStoryCompletionProvider(sessionStore, logger), '#'),
		vsc.languages.registerCompletionItemProvider(documentSelector, new AreaCompletionProvider(sessionStore, logger), ' '),
        vsc.languages.registerCompletionItemProvider(documentSelector, new TagCompletionProvider(sessionStore, logger), '#'),
        vsc.languages.registerCompletionItemProvider(documentSelector, new TeamMemberCompletionProvider(sessionStore, logger), '@'),
		vsc.languages.registerCodeLensProvider(documentSelector, new UserStoryCodeLensProvider()),
		vsc.languages.registerCodeActionsProvider(documentSelector, new ActivityCodeActionProvider(sessionStore)),
		vsc.languages.registerCodeActionsProvider(documentSelector, new AreaCodeActionProvider(sessionStore)),
        vsc.languages.registerDocumentLinkProvider(documentSelector, new WorkItemLinkProvider(config)),
		activityDiagnostics,
        areaDiagnostics
	]);
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void {}

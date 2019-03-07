import * as vsc from 'vscode';
import { Commands } from '../constants';

export class PublishCodeLensProvider implements vsc.CodeLensProvider {
	provideCodeLenses(document: vsc.TextDocument, token: vsc.CancellationToken): vsc.ProviderResult<vsc.CodeLens[]> {
		console.log("Refresh code lens")

		return [
			new vsc.CodeLens(
				new vsc.Range(0, 0, 4, 0),
				{
					title: "Publish to Azure DevOps, 3 tasks (24h)",
					command: Commands.publish
				}
			)
		]
	}
}
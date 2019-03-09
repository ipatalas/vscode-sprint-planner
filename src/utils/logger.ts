import * as vsc from 'vscode';

export class Logger implements vsc.Disposable {
	private logger: vsc.OutputChannel;

	constructor() {
		this.logger = vsc.window.createOutputChannel('Azure DevOps planner');
	}

	public log(text: string) {
		this.logger.appendLine(`[${new Date().toLocaleTimeString()}] ${text}`);
	}

	dispose() {
		this.logger.dispose();
	}
}
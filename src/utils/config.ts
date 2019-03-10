import * as vsc from 'vscode';
import { Logger } from './logger';

const ConfigurationKey = 'planner';

export class Configuration implements vsc.Disposable {
	public url: string | undefined;
	public token: string | undefined;

	private _onDidChange: vsc.EventEmitter<Configuration>;
	private _eventHandler: vsc.Disposable;

	get onDidChange() {
		return this._onDidChange.event;
	}

	get isValid() {
		return this.url && this.token;
	}

	constructor(logger: Logger) {
		this._onDidChange = new vsc.EventEmitter<Configuration>();

		this.load();
		logger.log('Configuration loaded');

		this._eventHandler = vsc.workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration(ConfigurationKey)) {
				logger.log('Configuration reloaded');
				this.load();
				this._onDidChange.fire(this);
			}
		})
	}

	public load() {
		const config = vsc.workspace.getConfiguration(ConfigurationKey);
		this.url = config.get('url');
		this.token = config.get('token');
	}

	dispose() {
		this._eventHandler.dispose();
		this._onDidChange.dispose();
	}
}
import * as vsc from 'vscode';
import { Logger } from './logger';

const ConfigurationKey = 'planner.azure-devops';

export class Configuration implements vsc.Disposable {
	public organization: string | undefined;
	public project: string | undefined;
	public team: string | undefined;
	public token: string | undefined;
	public debug!: boolean;

	private _onDidChange: vsc.EventEmitter<Configuration>;
	private _eventHandler: vsc.Disposable;

	get onDidChange() {
		return this._onDidChange.event;
	}

	get isValid() {
		return !!this.organization && !!this.project && !!this.team && !!this.token;
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
		});
	}

	public load() {
		const config = vsc.workspace.getConfiguration(ConfigurationKey);
		this.organization = config.get('organization');
		this.project = config.get('project');
		this.team = config.get('team');
		this.token = config.get('token');
		this.debug = config.get<boolean>('debug', false);
	}

	dispose() {
		this._eventHandler.dispose();
		this._onDidChange.dispose();
	}
}
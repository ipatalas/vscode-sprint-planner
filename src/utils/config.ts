import * as vsc from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger';
import Axios from 'axios';

const ConfigurationKey = 'planner.azure-devops';
const SnippetsConfigurationKey = 'planner.azure-devops.snippets';

export class Configuration implements vsc.Disposable {
    public process: string | undefined;
    public organization: string | undefined;
    public project: string | undefined;
    public team: string | undefined;
    public token: string | undefined;
    public debug!: boolean;
    public defaultActivity: string | undefined;
    public defaultArea: string | undefined;
    public snippets: { [name: string]: string } | undefined;

    private _onDidChange: vsc.EventEmitter<Configuration>;
    private _eventHandler: vsc.Disposable;

    get onDidChange(): vsc.Event<Configuration> {
        return this._onDidChange.event;
    }

    get isValid(): boolean {
        return !!this.organization && !!this.project && !!this.team && !!this.token;
    }

    constructor(private logger: Logger) {
        this._onDidChange = new vsc.EventEmitter<Configuration>();

        this.load(true).then(() => {
            logger.log('Configuration loaded');
        });

        this._eventHandler = vsc.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration(ConfigurationKey)) {
                const snippetsChanged = event.affectsConfiguration(SnippetsConfigurationKey);

                this.load(snippetsChanged).then(() => {
                    logger.log('Configuration reloaded');
                    this._onDidChange.fire(this);
                });
            }
        });
    }

    private async load(loadSnippets: boolean) {
        const config = vsc.workspace.getConfiguration(ConfigurationKey);
        this.organization = config.get('organization');
        this.project = config.get('project');
        this.team = config.get('team');
        this.token = config.get('token');
        this.process = config.get('process');
        this.debug = config.get<boolean>('debug', false);
        this.defaultActivity = config.get('default.activity');
        this.defaultArea = config.get('default.area');

        if (loadSnippets) {
            const snippets = config.get<SnippetConfig>('snippets');
            this.snippets = await this.loadSnippets(snippets);
        }
    }

    private async loadSnippets(snippets?: SnippetConfig): Promise<SnippetConfig> {
        if (!snippets || Object.keys(snippets).length === 0) {
            return Promise.resolve({});
        }

        const promises: Promise<void>[] = [];
        const result: SnippetConfig = {};

        for (const key in snippets) {
            promises.push(this.loadSingleSnippet(snippets[key])
                    .then(data => {
                        result[key] = data;
                    })
                    .catch((err: Error) => {
                        this.logger.log(
                            `Error loading snippet '${key}': ${err.message}`,
                            true
                        );
                        console.log(err);
                        throw err;
                    })
            );
        }

        try {
            await Promise.all(promises);
        } catch (err) {
            const seeDetailsAction = 'See details';
            vsc.window
                .showErrorMessage(
                    'Some snippets could not have been loaded',
                    seeDetailsAction
                )
                .then((item) => {
                    if (item === seeDetailsAction) {
                        this.logger.show();
                    }
                });
        }

        return result;
    }

    private async loadSingleSnippet(url: string) {
        if (url.startsWith('http') || url.startsWith('https')) {
            if (this.debug) {
                console.log(`[DEBUG] Getting ${url}`);
            }
            return Axios.get(url).then((r) => r.data as string);
        } else {
            return new Promise<string>((resolve, reject) => {
                if (this.debug) {
                    console.log(`[DEBUG] Reading ${url}`);
                }

                let filePath = url;
                if (vsc.workspace.workspaceFolders !== undefined && !path.isAbsolute(url)) {
                    filePath = path.join(
                        vsc.workspace.workspaceFolders[0].uri.fsPath,
                        filePath
                    );
                }

                fs.readFile(filePath, { encoding: 'UTF8' }, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
        }
    }

    dispose(): void {
        this._eventHandler.dispose();
        this._onDidChange.dispose();
    }
}

export interface SnippetConfig {
    [name: string]: string;
}

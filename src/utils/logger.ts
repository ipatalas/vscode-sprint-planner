import * as vsc from 'vscode';
import { Stopwatch } from './stopwatch';

export class Logger implements vsc.Disposable {
    private logger: vsc.OutputChannel;

    private isLineStillOpen = false;

    public debugEnabled = false;

    constructor() {
        this.logger = vsc.window.createOutputChannel('Sprint planner');
    }

    public log(text: string, appendLine = true): ((text: string) => void) | undefined {
        if (this.isLineStillOpen) {
            this.logger.appendLine('');
            this.isLineStillOpen = false;
        }

        const message = `[${this.buildTimestamp()}] ${text}`;

        if (appendLine) {
            this.logger.appendLine(message);
        } else {
            this.logger.append(message);
            this.isLineStillOpen = true;

            return (text: string) => {
                this.logger.appendLine(text);
                this.isLineStillOpen = false;
            };
        }

        return undefined;
    }

    public show(): void {
        this.logger.show(true);
    }

    public debug(text: string): void {
        if (this.debugEnabled) {
            this.log(`[DEBUG]: ${text}`);
        }
    }

    public perf(text: string): () => void {
        const finishLogLine = this.log(text, false);
        if (!finishLogLine) {
            return () => undefined;
        }

        const stopwatch = Stopwatch.startNew();

        return () => finishLogLine(` ${stopwatch.toString()}`);
    }

    private buildTimestamp() {
        const now = new Date();
        const time = now.toLocaleTimeString();
        const millis = Number(now.getMilliseconds()).toLocaleString(undefined, { minimumIntegerDigits: 3 });
        return `${time}.${millis}`;
    }

    dispose(): void {
        this.logger.dispose();
    }
}
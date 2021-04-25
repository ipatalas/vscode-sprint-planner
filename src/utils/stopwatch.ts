import prettyHrtime = require('pretty-hrtime');

export class Stopwatch {
	private time: [number, number];
	private isStopped = false;

	private constructor() {
		this.time = process.hrtime();
	}

	public static startNew(): Stopwatch {
		return new Stopwatch();
	}

	public stop(): void {
		if (!this.isStopped) {
			this.time = process.hrtime(this.time);
			this.isStopped = true;
		}
	}

	public toString(): string {
		this.stop();
		return prettyHrtime(this.time);
	}
}
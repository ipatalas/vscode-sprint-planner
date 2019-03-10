import prettyHrtime = require("pretty-hrtime");

export class Stopwatch {
	private time: [number, number];
	private isStopped: boolean = false;

	private constructor() {
		this.time = process.hrtime();
	}

	public static startNew() {
		return new Stopwatch();
	}

	public stop() {
		if (!this.isStopped) {
			this.time = process.hrtime(this.time);
			this.isStopped = true;
		}
	}

	public toString() {
		this.stop();
		return prettyHrtime(this.time);
	}
}
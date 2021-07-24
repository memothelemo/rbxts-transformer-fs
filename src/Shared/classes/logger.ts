import kleur from "kleur";

export class Logger {
	constructor(
		private header: string,
		private kleurFunction: kleur.Color,
		private verbose = false,
	) {}

	public writeMultipleLines(text: string[]) {
		this.writeLine(
			text.map(v => " ".repeat(this.header.length) + v).join("\n"),
		);
	}

	public writeLine(text: string) {
		console.log(`[${this.kleurFunction(this.header)}]: ${text}`);
	}

	public writeIfVerbose(text: string) {
		if (this.verbose) {
			this.writeLine(text);
		}
	}
}

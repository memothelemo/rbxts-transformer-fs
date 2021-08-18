/**
 * **LogManager** is a manager that logs everything, that's all.
 */
export class LogManager {
	static isOnNewLine = false;
	static isVerbose = false;

	/** Writes something but never ends with a new line */
	static write(text: string) {
		this.isOnNewLine = text.endsWith("\n");
		process.stdout.write(text);
	}

	/** Writes something in a line (even incomplete ones) */
	static writeLine(text: string) {
		if (!this.isOnNewLine) {
			this.write("\n");
		}
		this.write(text);
	}

	/** Writes something unless it is not in verbose mode */
	static writeIfVerbose(text: string) {
		if (this.isVerbose) {
			this.writeLine(text);
		}
	}
}

import ansi from "ansi-colors";
import { LogManager } from "../LogManager";
import { PKG_JSON } from "../util/package";

// just in case whenever i make a transformer based on
// this package
const ERROR_HEADER = `[${PKG_JSON.name} ${ansi.redBright("error")}]: `;

/** Base class of custom transformer error */
export abstract class BaseError {
	abstract readonly withHeader: boolean;

	public constructor() {
		debugger;
	}

	public abstract toString(): string;

	public print() {
		let result = this.toString();
		if (this.withHeader) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			result = `${ERROR_HEADER}${result}`;
		}
		LogManager.writeLine(result);
	}
}

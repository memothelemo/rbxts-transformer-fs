import ansi from "ansi-colors";
import { LogManager } from "../LogManager";
import { PKG_JSON } from "../util/package";

// just in case whenever i make a transformer based on
// this package
const HEADER = `[${ansi.blueBright(PKG_JSON.name)}]: `;
const HEADER_SPACING = " ".repeat(HEADER.length);

/**
 * Same functionally as print but it can only printed if it is in verbose :D
 * @param text
 */
export function printIfVerbose(...text: string[]) {
	if (LogManager.isVerbose) {
		print(...text);
	}
}

/**
 * Allows to print something with additional header to avoid
 * getting people confused when compiling their project to Luau
 *
 * _An alternative to console.log_
 */
export function print(...text: string[]) {
	let result = HEADER;

	if (text.length > 1) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		result += text
			.map((line, i) => (i === 0 ? line : `${HEADER_SPACING}${line}`))
			.join("\n");
	} else {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		result += text[0];
	}

	LogManager.writeLine(result);
}

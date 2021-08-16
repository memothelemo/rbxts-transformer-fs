import ansi from "ansi-colors";
import { LogManager } from "../LogManager";
import { PKG_JSON } from "../util/package";

// just in case whenever i make a transformer based on
// this package
const HEADER = `[${ansi.bgBlue(PKG_JSON.name)}]: `;
const HEADER_SPACING = " ".repeat(HEADER.length);

/**
 * Allows to print something with additional header to avoid
 * people confused when compiling their project to Luau
 *
 * _An alternative to console.log_
 */
export function print(...text: string[]) {
	let result = "";

	if (text.length > 1) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		result = text.map((line, i) => (i === 0 ? line : `${HEADER_SPACING}${line}`)).join("\n");
	} else {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		result = text[0] + "\n";
	}

	LogManager.write(result);
}

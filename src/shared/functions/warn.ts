import { print } from "./print";

/**
 * Warns the user in the command line interface
 */
export function warn(text: string) {
	print(`Transformer Warning: ${text}`);
}

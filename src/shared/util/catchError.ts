import { TransformerError } from "../../transformer/error";
import { TERMINATING_COMPILER_PROCESS_TXT } from "../errors/constants";
import { print } from "../functions/print";

/**
 * Catches any errors and prints it out
 *
 * Otherwise, it will return a value based on the return type of a callback argument
 */
export function catchError<T>(callback: () => T) {
	try {
		return callback();
	} catch (e) {
		if (e instanceof TransformerError) {
			e.print();
			print(TERMINATING_COMPILER_PROCESS_TXT);
			process.exit(1);
		} else {
			print(`Unexpected error! ${e}`);
			process.exit(1);
		}
	}
}

import { TransformerError } from "../../transformer/error";

/**
 * Tries to execute a callback or it will throw an error
 * (TransformerError specifically)
 */
export function tryOrError<T>(message: string, callback: () => T): T {
	try {
		return callback();
	} catch (e) {
		// if it is in verbose, we can grab info about it
		let finalMsg = message;
		if (e instanceof Error) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			finalMsg += `\n${e.message}\n${e.stack ?? "No stack available"}`;
		}
		throw new TransformerError(finalMsg);
	}
}

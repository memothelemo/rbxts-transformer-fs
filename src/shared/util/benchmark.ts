// benchmark haven module
import { print } from "../functions/print";

/**
 * Benchmarks callback argument
 *
 * It returns depending on the return type of the callback argument
 * @param message
 * @param callback
 */
export function benchmarkReturn<T>(message: string, callback: () => T) {
	const start = Date.now();
	const result = callback();

	const end = Date.now();
	print(`${message} ( ${end - start} ms )`);

	return result;
}

/** Benchmarks callback argument */
export function benchmarkCallback(message: string, callback: () => void) {
	// lazy
	benchmarkReturn(message, callback);
}

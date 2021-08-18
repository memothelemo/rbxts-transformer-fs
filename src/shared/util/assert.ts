import { PKG_JSON } from "./package";

/**
 * Asserts the `condition` or `value`, stops the debugger on failure.
 * @param value The value to check
 * @param message Optional, the message of the error
 */
export function assert(
	value: unknown,
	message = `Assertion failed!`,
): asserts value {
	if (!value) {
		debugger;
		throw new Error(
			`[${PKG_JSON.name}]: Assertion failed! ${message ?? ""}`,
		);
	}
}

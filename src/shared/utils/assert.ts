import chalk from "chalk";
import { PACKAGE_ISSUES_URL } from "shared/constants";

/**
 * Asserts the `condition` or `value`, stops the debugger on failure.
 * @param value The value to check the truthiness of
 * @param message Optional. The message of the error
 */
export function assert(value: unknown, message?: string): asserts value {
  if (!value) {
    debugger;
    throw new Error(
      `${chalk.bold.red("Assertion failed")}: ${message ?? "<no message>"}\n` +
        "This may be a transformer bug! Please submit a GitHub issue report at:\n" +
        chalk.bold.yellow(PACKAGE_ISSUES_URL),
    );
  }
}

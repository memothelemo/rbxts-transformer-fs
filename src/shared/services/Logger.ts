import chalk from "chalk";
import { TransformConfig } from "../config";
import { PACKAGE_NAME } from "../consts";
import { inspect } from "util";

const NAME_COLORED = PACKAGE_NAME;

const OPEN_BRACKET_COLORED = chalk.gray("[");
const CLOSE_BRACKET_COLORED = chalk.gray("]");

const DEBUG_MARKER = `${OPEN_BRACKET_COLORED}${chalk.bold.cyan(
  "DEBUG",
)} ${NAME_COLORED}${CLOSE_BRACKET_COLORED}`;
const WARN_MARKER = `${OPEN_BRACKET_COLORED}${chalk.bold.yellow(
  "WARN ",
)} ${NAME_COLORED}${CLOSE_BRACKET_COLORED}`;
const TRACE_MARKER = `${OPEN_BRACKET_COLORED}${chalk.bold.magenta(
  "TRACE",
)} ${NAME_COLORED}${CLOSE_BRACKET_COLORED}`;
const ERROR_MARKER = `${OPEN_BRACKET_COLORED}${chalk.bold.red(
  "ERROR",
)} ${NAME_COLORED}${CLOSE_BRACKET_COLORED}`;
const TREE_MARKER = chalk.gray("   │");

namespace Logger {
  export function configure(config: TransformConfig | undefined) {
    if (config !== undefined) log_debug = config.debug;

    // roblox-ts uses `process.stdout.write` to emit output text instead of
    // using console.log in https://github.com/roblox-ts/roblox-ts/blob/371f97cd0391dfee7b4c62ca09a1e5ec03ffee4c/src/Shared/classes/LogService.ts#L9.
    //
    // If `--verbose` flag is enabled by the user, it will perform some benchmarks
    // on how much long it takes to complete each step thus.
    //
    // Since we're dealing with transformers in this repository, roblox-ts emit `Running transformers...`
    // without a new line character (enter key) to monitor how long is to for all
    // configured transformers to transform TypeScript files (shown in this code:
    // https://github.com/roblox-ts/roblox-ts/blob/371f97cd0391dfee7b4c62ca09a1e5ec03ffee4c/src/Shared/util/benchmark.ts#L4
    // and https://github.com/roblox-ts/roblox-ts/blob/371f97cd0391dfee7b4c62ca09a1e5ec03ffee4c/src/Project/functions/compileFiles.ts#L110)
    //
    // We're putting a new line character (or enter key to begin with a new line) to avoid
    // colliding with the `Running transformers...` text.
    if (log_trace) process.stdout.write("\n");
  }

  export function getTreeStack() {
    return tree_stack;
  }

  export function resetTreeStack(override?: number) {
    if (log_debug) tree_stack = override ?? 0;
  }

  export function benchmark<T>(task: string | (() => string), callback: () => T): T {
    if (!log_debug) return callback();

    const resolved_task_name = resolve_value(task);
    debug(chalk.gray(`${resolved_task_name}...`));
    pushTree();

    const now = Date.now();
    const result = callback();
    const elapsed = Date.now() - now;
    popTree();

    debug(`${chalk.gray(`${resolved_task_name} done;`)} took = ${elapsed} ms`);
    return result;
  }

  export function pushTreeWithin<T>(context: string, callback: () => T): T;
  export function pushTreeWithin<T>(context: string, callback: () => T, use_trace: boolean): T;
  export function pushTreeWithin<T>(context: string, callback: () => T, use_trace?: boolean): T {
    const use_debug = use_trace === null || use_trace !== false;
    const can_log_this = use_debug ? log_debug : log_trace;
    if (!can_log_this) return callback();

    const log = use_debug ? debug : trace;
    log(chalk.gray(`Start of "${context}"`));
    pushTree();

    const result = callback();
    popTree();
    log(chalk.gray(`End of "${context}"`));

    return result;
  }

  export function debug(...messages: unknown[]) {
    if (log_debug) log(DEBUG_MARKER, messages);
  }

  export function debugValue(name: string, value: unknown) {
    if (log_debug) log(DEBUG_MARKER, [`${chalk.bold(`${name}:`)} ${resolve_value(value)}`]);
  }

  export function trace(...messages: unknown[]) {
    if (log_trace) log(TRACE_MARKER, messages);
  }

  export const warn = (...messages: unknown[]) => log(WARN_MARKER, messages);
  export const error = (...messages: unknown[]) => log(ERROR_MARKER, messages);

  const log_trace = process.argv.includes("--verbose");
  let log_debug = false;
  let tree_stack = 0;

  function resolve_value(message: unknown): string {
    return typeof message === "string"
      ? message
      : typeof message === "function"
      ? resolve_value(message())
      : inspect(message, true);
  }

  function log(prefix: string, messages: unknown[]) {
    const tree_marker = TREE_MARKER.repeat(tree_stack);
    for (const message of messages) {
      const text = resolve_value(message);
      process.stdout.write(
        `${prefix}${tree_marker} ${text.replace(/\n/g, `\n${prefix}${tree_marker} `)}\n`,
      );
    }
  }

  export function pushTree() {
    if (log_debug) tree_stack += 1;
  }

  export function popTree() {
    if (log_debug) tree_stack -= 1;
  }
}

export default Logger;

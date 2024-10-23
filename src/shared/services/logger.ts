import chalk from "chalk";
import { PACKAGE_NAME } from "../constants";
import { inspect } from "util";
import { getTimeMs } from "@shared/util/getTimeMs";

const HEADER = `${chalk.gray("[")}%s ${PACKAGE_NAME}${chalk.gray("]")}`;
const DEBUG_MARKER = HEADER.replace("%s", chalk.bold.cyan("DEBUG"));
const WARN_MARKER = HEADER.replace("%s", chalk.bold.yellow("WARN "));
const TRACE_MARKER = HEADER.replace("%s", chalk.bold.magenta("TRACE"));
const ERROR_MARKER = HEADER.replace("%s", chalk.bold.red("TRACE"));

const START_TREE_SYMBOL = chalk.gray("┐");
const STRAIGHT_TREE_SYMBOL = chalk.gray("│ ");
const JUNCTION_TREE_SYMBOL = chalk.gray("├");
const DASH_TREE_SYMBOL = chalk.gray("─");
const END_TREE_SYMBOL = chalk.gray("┘");

namespace Logger {
    const logTrace = process.argv.includes("--verbose");

    let depth = 0;
    let logDebug = true;

    export const debug = (...messages: unknown[]) => {
        if (logDebug) log(DEBUG_MARKER, messages);
    };

    export const value = (name: string, value: unknown) => {
        if (logDebug) {
            log(DEBUG_MARKER, [`${chalk.gray.italic(`${name}=`)}${outputValue(value)}`]);
        }
    };

    export const error = (...messages: unknown[]) => log(ERROR_MARKER, messages);
    export const warn = (...messages: unknown[]) => log(WARN_MARKER, messages);

    export const trace = (...messages: unknown[]) => {
        if (logTrace) log(TRACE_MARKER, messages);
    };

    export function getDepth() {
        return depth;
    }

    export function resetDepth(override?: number) {
        if (logDebug) depth = override ?? 0;
    }

    export function push(title: unknown) {
        if (logDebug) {
            process.stdout.write(`${DEBUG_MARKER} `);
            if (depth > 0) {
                for (let i = 0; i < depth - 1; i++) process.stdout.write(STRAIGHT_TREE_SYMBOL);
                process.stdout.write(JUNCTION_TREE_SYMBOL);
                process.stdout.write(DASH_TREE_SYMBOL);
            }
            process.stdout.write(`${START_TREE_SYMBOL}${chalk.bold(outputValue(title))}\n`);
            depth += 1;
        }
    }

    export function pop() {
        if (logDebug) {
            depth -= 1;
            process.stdout.write(`${DEBUG_MARKER} `);
            for (let i = 0; i < depth - 1; i++) process.stdout.write(STRAIGHT_TREE_SYMBOL);
            if (depth > 0) {
                process.stdout.write(JUNCTION_TREE_SYMBOL);
                process.stdout.write(DASH_TREE_SYMBOL);
            }
            process.stdout.write(`${END_TREE_SYMBOL}\n`);
        }
    }

    export function benchmark<T>(task: string, callback: () => T): T;
    export function benchmark<T>(task: string, callback: () => T, debugOnly: false): T;
    export function benchmark<T>(task: string, callback: () => T, debugOnly?: boolean): T {
        debugOnly = debugOnly ?? true;

        const shouldLogAsTrace = !debugOnly && logTrace && !logDebug;
        const shouldLog = shouldLogAsTrace || (debugOnly && logDebug);
        if (!shouldLog) return callback();

        if (shouldLogAsTrace) {
            trace(`${task}...`);
        } else {
            push(`${task}...`);
        }

        const now = getTimeMs();
        const result = callback();
        const elapsed = getTimeMs() - now;

        const prettyElapsed = elapsed.toFixed(2);
        if (logDebug) {
            value("elapsed", `${prettyElapsed}ms`);
        } else {
            trace(`${task} done${chalk.gray("; elapsed=")}${prettyElapsed}ms`);
        }
        pop();

        return result;
    }

    export function setup() {
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
        if (logTrace) {
            process.stdout.write("\n");
        }
    }

    export function setDebug(value: boolean) {
        logDebug = value;
    }

    function outputValue(value: unknown): string {
        const typeOf = typeof value;
        if (typeOf === "function") {
            return outputValue((value as () => unknown)());
        } else if (typeOf === "string") {
            return value as string;
        } else {
            return inspect(value, true);
        }
    }

    function log(prefix: string, messages: unknown[]) {
        let renderedPrefix = prefix;
        if (depth > 0) {
            renderedPrefix += " ";
            for (let i = 0; i < depth - 1; i++) renderedPrefix += STRAIGHT_TREE_SYMBOL;
            renderedPrefix += `${JUNCTION_TREE_SYMBOL}${DASH_TREE_SYMBOL} `;
        }

        for (const message of messages) {
            const text = outputValue(message);
            process.stdout.write(
                `${renderedPrefix} ${text.replace(/\n/g, `\n${renderedPrefix} `)}\n`,
            );
        }
    }
}

export default Logger;

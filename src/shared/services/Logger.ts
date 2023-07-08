import chalk from "chalk";
import { PACKAGE_NAME } from "shared/constants";

const TRANSFORMER_NAME_COLORED = PACKAGE_NAME;

const DEBUG_CODE = `[${chalk.cyan("DEBUG")} ${TRANSFORMER_NAME_COLORED}]`;
const WARN_CODE = `[${chalk.yellow("WARN ")} ${TRANSFORMER_NAME_COLORED}]`;
const TRACE_CODE = `[${chalk.magenta("TRACE")} ${TRANSFORMER_NAME_COLORED}]`;
const ERROR_CODE = `[${chalk.red("ERROR")} ${TRANSFORMER_NAME_COLORED}]`;

const TREE_MARKER = chalk.gray("   │");

export class Logger {
  public static treeStackLength = 0;

  private static writeRaw(message: string) {
    process.stdout.write(message);
  }

  private static toMessage(message: unknown) {
    return typeof message === "string" ? message : JSON.stringify(message, undefined, "  ");
  }

  private static constructTreeMarker() {
    return TREE_MARKER.repeat(this.treeStackLength);
  }

  private static writeLine(prefix: string, messages: unknown[]) {
    const treeMarker = this.constructTreeMarker();
    for (const message of messages) {
      const text = this.toMessage(message);
      this.writeRaw(`${prefix}${treeMarker} ${text.replace(/\n/g, `\n${prefix}${treeMarker} `)}\n`);
    }
  }

  public static debugMode = false;
  public static canPrintTrace = false;

  /**
   * This should be ran in transformer's main function
   */
  public static setup(debugMode: boolean, verbose: boolean) {
    this.debugMode = debugMode;
    this.canPrintTrace = verbose;
    if (this.canPrintTrace) this.writeRaw("\n");
  }

  public static pushTreeWith<T>(callback: () => T) {
    if (!this.debugMode) return callback();
    this.pushTree();
    const result = callback();
    this.popTree();
    return result;
  }

  public static pushTree() {
    if (!this.debugMode) return;
    this.treeStackLength += 1;
  }

  public static popTree() {
    if (!this.debugMode) return;
    if (this.treeStackLength !== 0) this.treeStackLength -= 1;
  }

  public static debug(...messages: unknown[]) {
    if (this.debugMode) this.writeLine(DEBUG_CODE, messages);
  }

  public static trace(...messages: unknown[]) {
    if (this.canPrintTrace) this.writeLine(TRACE_CODE, messages);
  }

  public static warn(...messages: unknown[]) {
    this.writeLine(WARN_CODE, messages);
  }

  public static error(...messages: unknown[]) {
    this.writeLine(ERROR_CODE, messages);
  }

  public static benchmark<T>(message: string, push: boolean, callback: () => T) {
    Logger.debug(message);
    if (push) Logger.pushTree();

    const now = Date.now();
    const result = callback();
    const elapsed = Date.now() - now;

    Logger.debug(chalk.gray(`elapsed = ${elapsed} ms`));
    if (push) Logger.popTree();

    return result;
  }
}

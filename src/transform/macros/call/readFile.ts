import { Logger } from "core/classes/Logger";
import { Diagnostics } from "core/classes/Diagnostics";
import path from "path";
import { factory } from "transform/factory";
import { macros } from "../macros";
import { CallMacro } from "../types";

export const ReadFileMacro: CallMacro = {
  getSymbols(state) {
    const file = state.symbolProvider.getModuleFileOrThrow();
    return file.getFromExports("$readFile");
  },

  transform(state, node) {
    const [firstArg] = node.arguments;
    if (firstArg === undefined) return;

    const filePath = macros.resolvePathFromExpr(state, firstArg);
    if (filePath === undefined) return;
    Logger.debug(`Arguments: path = ${path.relative(state.project.rootDir, filePath)}`);

    const now = Date.now();
    const result = macros.readFileOpt(state, firstArg, filePath);
    if (result === undefined) Diagnostics.error(firstArg, "Specified path not found");

    const elapsed = Date.now() - now;
    Logger.debug(`Done reading file, elapsed = ${elapsed} ms`);
    return result;
  },
};

export const ReadFileOptMacro: CallMacro = {
  getSymbols(state) {
    const file = state.symbolProvider.getModuleFileOrThrow();
    return file.getFromExports("$readFileOpt");
  },

  transform(state, node) {
    const [firstArg] = node.arguments;
    if (firstArg === undefined) return;

    const filePath = macros.resolvePathFromExpr(state, firstArg);
    if (filePath === undefined) return;
    Logger.debug(`Arguments: path = ${path.relative(state.project.rootDir, filePath)}`);

    const now = Date.now();
    const result = macros.readFileOpt(state, firstArg, filePath) ?? factory.none();
    const elapsed = Date.now() - now;

    Logger.debug(`Done reading file, elapsed = ${elapsed} ms`);
    return result;
  },
};

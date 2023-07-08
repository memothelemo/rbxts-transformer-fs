import fs from "fs";
import { Diagnostics } from "shared/services/Diagnostics";
import { Logger } from "shared/services/Logger";
import { TransformState } from "transform/classes/TransformState";
import { f } from "transform/factory";
import { macros } from "transform/macros";
import ts from "typescript";
import { CallMacro } from "../types";

function expectBase(state: TransformState, node: ts.CallExpression, checker: (path: string) => boolean) {
  const firstArg = node.arguments[0];
  if (!f.is.string(firstArg)) Diagnostics.error(firstArg, "Invalid path argument");

  const secondArg = node.arguments.at(1);
  let errorMessage = "Specified path not found";

  if (secondArg !== undefined) {
    if (!f.is.string(secondArg)) Diagnostics.error(secondArg, "Invalid custom error message argument");
    if (!secondArg) Diagnostics.error(secondArg, "Custom error message is empty");
    errorMessage = macros.utils.getStringValue(secondArg);
  }

  const path = macros.utils.resolvePath(state, firstArg, macros.utils.getStringValue(firstArg));
  Logger.debug(`path = ${state.project.relativeTo(path)}, errorMessage = "${errorMessage}"`);

  return checker(path) ? f.nil() : Diagnostics.error(firstArg, errorMessage);
}

export const ExpectPathMacro: CallMacro = {
  getSymbols(symbols) {
    return symbols.moduleFile.getFromExport("$expectPath");
  },

  transform(state, node) {
    return expectBase(state, node, fs.existsSync);
  },
};

export const ExpectDirMacro: CallMacro = {
  getSymbols(symbols) {
    return symbols.moduleFile.getFromExport("$expectDir");
  },

  transform(state, node) {
    return expectBase(state, node, macros.utils.isDir);
  },
};

export const ExpectFileMacro: CallMacro = {
  getSymbols(symbols) {
    return symbols.moduleFile.getFromExport("$expectFile");
  },

  transform(state, node) {
    return expectBase(state, node, macros.utils.isFile);
  },
};

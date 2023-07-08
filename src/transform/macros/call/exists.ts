import fs from "fs";
import { Diagnostics } from "shared/services/Diagnostics";
import { Logger } from "shared/services/Logger";
import { TransformState } from "transform/classes/TransformState";
import { f } from "transform/factory";
import { macros } from "transform/macros";
import ts from "typescript";
import { CallMacro } from "../types";

function existsBase(state: TransformState, node: ts.CallExpression, checker: (path: string) => boolean) {
  const firstArg = node.arguments[0];
  if (!f.is.string(firstArg)) Diagnostics.error(firstArg, "Invalid path argument");

  const path = macros.utils.resolvePath(state, firstArg, macros.utils.getStringValue(firstArg));
  Logger.debug(`path = ${state.project.relativeTo(path)}`);

  return f.bool(checker(path));
}

export const PathExistsMacro: CallMacro = {
  getSymbols(symbols) {
    return symbols.moduleFile.getFromExport("$pathExists");
  },

  transform(state, node) {
    return existsBase(state, node, fs.existsSync);
  },
};

export const FileExistsMacro: CallMacro = {
  getSymbols(symbols) {
    return symbols.moduleFile.getFromExport("$fileExists");
  },

  transform(state, node) {
    return existsBase(state, node, p => macros.utils.isFile(p));
  },
};

export const DirExistsMacro: CallMacro = {
  getSymbols(symbols) {
    return symbols.moduleFile.getFromExport("$dirExists");
  },

  transform(state, node) {
    return existsBase(state, node, p => macros.utils.isDir(p));
  },
};

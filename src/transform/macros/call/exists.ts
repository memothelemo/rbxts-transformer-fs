import { Logger } from "core/classes/Logger";
import fs from "fs";
import path from "path";
import { macros } from "../macros";
import { CallMacro } from "../types";
import { factory } from "transform/factory";

export const PathExistsMacro: CallMacro = {
  getSymbols(state) {
    return state.symbolProvider.getModuleFileOrThrow().getFromExports("$pathExists");
  },

  transform(state, node) {
    const [firstArg] = node.arguments;
    if (firstArg === undefined) return;

    const pathArg = macros.resolvePathFromExpr(state, firstArg);
    if (pathArg === undefined) return;
    Logger.debug(`Arguments: path = ${path.relative(state.project.path, pathArg)}`);

    return factory.bool(fs.existsSync(pathArg));
  },
};

export const FileExistsMacro: CallMacro = {
  getSymbols(state) {
    return state.symbolProvider.getModuleFileOrThrow().getFromExports("$fileExists");
  },

  transform(state, node) {
    const [firstArg] = node.arguments;
    if (firstArg === undefined) return;

    const pathArg = macros.resolvePathFromExpr(state, firstArg);
    if (pathArg === undefined) return;
    Logger.debug(`Arguments: path = ${path.relative(state.project.path, pathArg)}`);

    return factory.bool(macros.filesystem.isExistsAndFile(pathArg));
  },
};

export const DirExistsMacro: CallMacro = {
  getSymbols(state) {
    return state.symbolProvider.getModuleFileOrThrow().getFromExports("$dirExists");
  },

  transform(state, node) {
    const [firstArg] = node.arguments;
    if (firstArg === undefined) return;

    const pathArg = macros.resolvePathFromExpr(state, firstArg);
    if (pathArg === undefined) return;
    Logger.debug(`Arguments: path = ${path.relative(state.project.path, pathArg)}`);

    return factory.bool(macros.filesystem.isExistsAndDir(pathArg));
  },
};

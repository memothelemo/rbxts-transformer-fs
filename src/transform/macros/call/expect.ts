import { Diagnostics } from "core/classes/Diagnostics";
import { Logger } from "core/classes/Logger";
import { macros } from "../macros";
import { CallMacro } from "../types";
import fs from "fs";
import path from "path";
import { getLiteralStringValue } from "transform/utils/getLiteralStringValue";
import { factory } from "transform/factory";

const NOT_FOUND = "Specified path not found";

export const ExpectFileMacro: CallMacro = {
  getSymbols(state) {
    return state.symbolProvider.getModuleFileOrThrow().getFromExports("$expectFile");
  },

  transform(state, node) {
    const [firstArg, secondArg] = node.arguments;
    if (firstArg === undefined) return;

    const pathArg = macros.resolvePathFromExpr(state, firstArg);
    if (pathArg === undefined) return;

    let errorMessage = NOT_FOUND;
    if (secondArg !== undefined) {
      const initial = getLiteralStringValue(state, secondArg);
      if (initial === undefined) Diagnostics.error(secondArg, "Expected a string literal");
      errorMessage = initial;
    }

    Logger.debug(
      `Arguments: path = ${path.relative(state.project.path, pathArg)}, customErrorMessage = ${errorMessage}`,
    );

    if (!macros.filesystem.isExistsAndFile(pathArg)) {
      Diagnostics.error(firstArg, errorMessage);
    }

    // This is to avoid internal errors given from typescript
    return factory.none();
  },
};

export const ExpectDirMacro: CallMacro = {
  getSymbols(state) {
    return state.symbolProvider.getModuleFileOrThrow().getFromExports("$expectDir");
  },

  transform(state, node) {
    const [firstArg, secondArg] = node.arguments;
    if (firstArg === undefined) return;

    const pathArg = macros.resolvePathFromExpr(state, firstArg);
    if (pathArg === undefined) return;

    let errorMessage = NOT_FOUND;
    if (secondArg !== undefined) {
      const initial = getLiteralStringValue(state, secondArg);
      if (initial === undefined) Diagnostics.error(secondArg, "Expected a string literal");
      errorMessage = initial;
    }

    Logger.debug(
      `Arguments: path = ${path.relative(state.project.path, pathArg)}, customErrorMessage = ${errorMessage}`,
    );

    if (!macros.filesystem.isExistsAndDir(pathArg)) {
      Diagnostics.error(firstArg, errorMessage);
    }

    // This is to avoid internal errors given from typescript
    return factory.none();
  },
};

export const ExpectPathMacro: CallMacro = {
  getSymbols(state) {
    return state.symbolProvider.getModuleFileOrThrow().getFromExports("$expectPath");
  },

  transform(state, node) {
    const [firstArg, secondArg] = node.arguments;
    if (firstArg === undefined) return;

    const pathArg = macros.resolvePathFromExpr(state, firstArg);
    if (pathArg === undefined) return;

    let errorMessage = NOT_FOUND;
    if (secondArg !== undefined) {
      const initial = getLiteralStringValue(state, secondArg);
      if (initial === undefined) Diagnostics.error(secondArg, "Expected a string literal");
      errorMessage = initial;
    }

    Logger.debug(
      `Arguments: path = ${path.relative(state.project.path, pathArg)}, customErrorMessage = ${errorMessage}`,
    );

    if (!fs.existsSync(pathArg)) {
      Diagnostics.error(firstArg, errorMessage);
    }

    // This is to avoid internal errors given from typescript
    return factory.none();
  },
};

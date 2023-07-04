import { Diagnostics } from "core/classes/Diagnostics";
import { Logger } from "core/classes/Logger";
import fs from "fs";
import ts from "typescript";
import path from "path";
import { CallMacro } from "../types";
import { macros } from "../macros";

export const InstanceMacro: CallMacro = {
  getSymbols(state) {
    return state.symbolProvider.getModuleFileOrThrow().getFromExports("$instance");
  },

  transform(state, node) {
    // Resolving $instance call arguments
    const [firstArg, secondArg] = node.arguments;
    if (firstArg === undefined) return;

    const pathArg = macros.resolvePathFromExpr(state, firstArg);
    let exactPath = false;

    if (pathArg === undefined) return;
    if (secondArg !== undefined) {
      if (!ts.isBooleanLiteral(secondArg)) return;
      exactPath = secondArg.kind === ts.SyntaxKind.TrueKeyword;
    }

    Logger.debug(`Arguments: path = ${path.relative(state.project.rootDir, pathArg)}, exactPath = ${exactPath}`);

    // Getting the roblox tree version of that path
    if (!fs.existsSync(pathArg)) Diagnostics.error(firstArg, "Specified path not exists");

    return macros.makeInstanceGetter(state, node, firstArg, pathArg, exactPath, false);
  },
};

import { Diagnostics } from "core/classes/Diagnostics";
import { Logger } from "core/classes/Logger";
import fs from "fs";
import path from "path";
import { TransformState } from "transform/classes/TransformState";
import { factory } from "transform/factory";
import { getLineAndColumnOfNode } from "transform/utils/getLineAndColumnOfNode";
import { getLiteralStringValue } from "transform/utils/getLiteralStringValue";
import ts from "typescript";
import { toUnixLikePath } from "utils/functions/toUnixLikePath";
import { toHumanReadableBytes } from "utils/functions/toHumanReadableBytes";
import { DeprecatedMacroInfo } from "./types";
// import { getFilePathSubext } from "utils/functions/getFilePathSubext";
// import { NetworkType } from "@roblox-ts/rojo-resolver";

/**
 * Base macro implementations so that I won't repeat myself
 */
export namespace macros {
  export namespace filesystem {
    export function isExistsAndFile(path: string) {
      return fs.existsSync(path) && fs.statSync(path).isFile();
    }

    export function isExistsAndDir(path: string) {
      return fs.existsSync(path) && fs.statSync(path).isDirectory();
    }
  }

  export function readFileOpt(state: TransformState, filePathArgument: ts.Node, path: string) {
    if (!fs.existsSync(path)) return;

    const fileStatus = fs.statSync(path);
    if (!fileStatus.isFile()) Diagnostics.error(filePathArgument, "Specified path is not a file!");

    if (fileStatus.size > state.config.readFileSizeLimit) {
      Diagnostics.error(
        filePathArgument,
        `This file reaches the file size limit! (limit = ${toHumanReadableBytes(
          state.config.readFileSizeLimit,
        )}, actual size = ${toHumanReadableBytes(fileStatus.size)})`,
      );
    }

    return factory.string(fs.readFileSync(path).toString());
  }

  export function resolvePathFromExpr(state: TransformState, expr: ts.Expression) {
    const value = getLiteralStringValue(state, expr);
    if (value === undefined) return;

    const filePath = expr.getSourceFile().fileName;
    return value.startsWith("./")
      ? path.join(path.dirname(filePath), value)
      : value === "."
      ? filePath
      : path.join(state.project.path, value);
  }

  export function currentFileName(state: TransformState, node: ts.Node) {
    const relativePath = path.relative(state.project.rootDir, node.getSourceFile().resolvedPath).replace(/\\/g, "/");
    return factory.string(toUnixLikePath(relativePath));
  }

  export function preTransform(kind: string, node: ts.Node, symbol: ts.Symbol, macro: DeprecatedMacroInfo) {
    const [line, column] = getLineAndColumnOfNode(node);
    Logger.debug(`Found ${kind} macro at line ${line}, column ${column}, name = ${symbol.name}`);
    warnIfDeprecated(node, symbol.name, macro);
  }

  export function warnIfDeprecated(node: ts.Node, macroName: string, macro: DeprecatedMacroInfo) {
    if (macro.deprecated) {
      let message = `${macroName} is deprecated.`;
      if (macro.deprecatedMessage) message += ` ${macro.deprecatedMessage}`;
      Diagnostics.warn(node, message);
    }
  }
}

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
  export function makeInstanceGetter(
    state: TransformState,
    callerNode: ts.Node,
    targetPathArg: ts.Expression,
    targetPath: string,
    exactPath: boolean,
    useWaitFor: boolean,
  ) {
    // const rojoResolver = state.rojoResolver;
    // const sourceFilePath = callerNode.getSourceFile().fileName;

    // const objectRbxPath = rojoResolver.getRbxPathFromFilePath(state.pathTranslator.getOutputPath(targetPath));
    // const sourceFileRbxPath = rojoResolver.getRbxPathFromFilePath(state.pathTranslator.getOutputPath(sourceFilePath));

    // if (!objectRbxPath) Diagnostics.error(targetPathArg, "Could not find rojo data for this path");
    // if (!sourceFileRbxPath) Diagnostics.error(callerNode, "Could not find rojo data for this file");

    // // Getting the network types of both target path and source file
    // const objectNetworkType = rojoResolver.getNetworkType(objectRbxPath);
    // const sourceFileNetworkType = rojoResolver.getNetworkType(sourceFileRbxPath);
    // const seemsCompatible = objectNetworkType === sourceFileNetworkType;

    // // Also, we need to get the actual subext of the file to have a Rojo hack
    // let isRuntimeScript = false;
    // {
    //   const subext = getFilePathSubext(sourceFilePath);
    //   isRuntimeScript = subext === "client" || subext === "server";
    // }

    // // Evaluating usage of $instance of client and server runtime scripts
    // if (isRuntimeScript) {
    //   Logger.debug(`This source file is a runtime script, evaluating usage of $instance`);
    //   if (!seemsCompatible && !exactPath) {
    //     Diagnostics.error(targetPathArg, "Incompatible path");
    //   }
    // }

    // // Applicable to models/plugins, which will be supported soon
    // if (
    //   objectNetworkType === NetworkType.Unknown &&
    //   sourceFileNetworkType === NetworkType.Unknown &&
    //   !rojoResolver.isGame
    // ) {
    //   throw "TODO: Support for plugins";
    // }

    // // Generating code for some thing huhuhu
    // const gameIdent = factory.identifier("game");
    // let rootIdent: ts.Identifier;

    // if (objectNetworkType === NetworkType.Client) {
    //   rootIdent = factory.identifier("localPlayer", true);
    //   state.addPrereqStmts(
    //     factory.declareVariable(
    //       rootIdent,
    //       factory.access(
    //         factory.call(factory.access(gameIdent, factory.identifier("GetService")), undefined, [
    //           factory.string("Players"),
    //         ]),
    //         factory.identifier("LocalPlayer"),
    //       ),
    //     ),
    //     factory.callStmt(factory.identifier("assert"), undefined, [
    //       rootIdent,
    //       factory.string("LocalPlayer is undefined"),
    //     ]),
    //   );
    // } else {
    //   rootIdent = gameIdent;
    // }

    // // ReplicatedStorage is preloaded
    // if (sourceFileNetworkType === NetworkType.Client && objectRbxPath.at(0) === "ReplicatedStorage") {
    //   // Add game.isLoaded check
    //   state.addPrereqStmt(
    //     factory.ifStmt(
    //       factory.negate(factory.call(factory.access(gameIdent, factory.identifier("IsLoaded")))),
    //       factory.block([
    //         factory.callStmt(factory.accessChain(gameIdent, factory.identifier("Loaded"), factory.identifier("Wait"))),
    //       ]),
    //     ),
    //   );
    // }

    // // Accessing this guy time!
    // const remainingOnes = objectRbxPath.slice(1, objectRbxPath.length);

    // let base: ts.Expression = factory.call(factory.access(rootIdent, factory.identifier("FindFirstChild")), undefined, [
    //   factory.string(objectRbxPath.at(0)!),
    // ]);

    // for (const path of remainingOnes) {
    //   const call = factory.call(factory.optionalAccess(base, factory.identifier("FindFirstChild")), undefined, [
    //     factory.string(path),
    //   ]);
    //   base = call;

    //   // const findFirstChildCall = factory.call(), undefined, [
    //   //   factory.string(path),
    //   // ]);

    //   // base = requiresNilChecking ?  : factory.nonnull(findFirstChildCall);

    //   // if (rootIdent === gameIdent) {
    //   // base =
    //   // } else {
    //   // base = requiresNilChecking ? factory.optionalAccess(base, path) : factory.access(base, path);
    //   // }
    // }

    return factory.string("TODO");
  }

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

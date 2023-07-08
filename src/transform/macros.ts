import { FileRelation, NetworkType, RbxPath, RbxType } from "@roblox-ts/rojo-resolver";
import fs from "fs";
import path from "path";
import { Diagnostics } from "shared/services/Diagnostics";
import { Logger } from "shared/services/Logger";
import { assert } from "shared/utils/assert";
import ts from "typescript";
import { LoadedMacro, Macro } from "transform/macros/types";
import { TransformState } from "./classes/TransformState";
import { getLineAndColumnOfNode } from "./utils/getLineAndColumnOfNode";
import { f } from "./factory";
import { arrayStartsWith } from "shared/utils/arrayStartsWith";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SecondParameter<T> = T extends (first: any, second: infer A, ...args: any) => any ? A : any;

const CONTAINERS_TO_LOCAL_PLAYER: [RbxPath, string][] = [
  [["StarterPack"], "Backpack"],
  [["StarterGui"], "PlayerGui"],
  [["StarterPlayer", "StarterPlayerScripts"], "PlayerScripts"],
];
const STARTER_PLAYER_CONTAINER: RbxPath = ["StarterPlayer"];
const STARTER_CHARACTER_CONTAINER: RbxPath = ["StarterPlayer", "StarterCharacter"];
const STARTER_CHARACTER_SCRIPTS_CONTAINER: RbxPath = ["StarterPlayer", "StarterCharacterScripts"];

/** Macro utilities */
export namespace macros {
  export namespace utils {
    function isRuntimeScript(type: RbxType) {
      return type !== RbxType.ModuleScript;
    }

    export function getInstanceInfoFromPath(
      state: TransformState,
      argumentNode: ts.Node,
      targetPath: string,
      useExactRbxPath: boolean,
      useOptionalChains: boolean,
    ) {
      // TODO: Don't forget to check rojo as well, :(
      assert(state.project.rojoResolver.isGame, "Plugin/model support is not implemented");

      const rojoResolver = state.project.rojoResolver;
      const pathTranslator = state.project.pathTranslator;

      const sourceFilePath = pathTranslator.getOutputPath(argumentNode.getSourceFile().fileName);
      const sourceFileRbxPath = rojoResolver.getRbxPathFromFilePath(sourceFilePath);

      targetPath = pathTranslator.getOutputPath(targetPath);
      let targetRbxPath = rojoResolver.getRbxPathFromFilePath(targetPath);

      // TODO: Make this error more elaborate
      if (sourceFileRbxPath === undefined || targetRbxPath === undefined) {
        Diagnostics.error(argumentNode, `Cannot find rojo data`);
      }

      if (Logger.debugMode) {
        Logger.debug(`sourceFileRbxPath = ${JSON.stringify(sourceFileRbxPath)}`);
        Logger.debug(`targetRbxPath = ${JSON.stringify(targetRbxPath)}`);
      }

      const sourceFileRbxType = rojoResolver.getRbxTypeFromFilePath(sourceFilePath);
      // const targetRbxType = rojoResolver.getRbxTypeFromFilePath(targetPath);
      let useLocalPlayer = false;

      if (isRuntimeScript(sourceFileRbxType)) {
        // Check the network type for both the source file and the target file
        const sourceFileNetworkType = rojoResolver.getNetworkType(sourceFileRbxPath);
        const targetNetworkType = rojoResolver.getNetworkType(targetRbxPath);
        useLocalPlayer =
          sourceFileNetworkType === NetworkType.Client && targetNetworkType === NetworkType.Client && !useExactRbxPath;

        // Maybe unknown is okay, no need to check even further
        const hasUnknownLocation =
          sourceFileNetworkType === NetworkType.Unknown || targetNetworkType === NetworkType.Unknown;

        Logger.debug(
          `file.networkType = ${NetworkType[sourceFileNetworkType]}, target.networkType = ${NetworkType[targetNetworkType]}`,
        );
        if (!hasUnknownLocation && sourceFileNetworkType !== targetNetworkType && !useExactRbxPath) {
          // TODO: Explain why is that so
          Diagnostics.error(
            argumentNode,
            "This path cannot be possibly retrieved.",
            "",
            "If you mean to get the actual instance of that path, please use 'exact' argument and set it to true.",
          );
        }
      }

      Logger.debug(`useLocalPlayer = ${useLocalPlayer}`);

      // Variable declaration stuff you gotta deal with it
      const rootInstance = f.identifier("game");
      const baseInstance = f.identifier("baseInstance", true);

      if (useLocalPlayer) {
        // Translate the isolated containers
        let baseInstanceExpr = f.index(
          f.call(f.index(rootInstance, f.identifier("GetService")), undefined, [f.string("Players")]),
          f.identifier("LocalPlayer"),
        );
        let hasContainerYet = false;
        for (const [required, use] of CONTAINERS_TO_LOCAL_PLAYER) {
          if (arrayStartsWith(required, targetRbxPath)) {
            if (Logger.debugMode) Logger.debug(`Using container of ${use}, required = ${JSON.stringify(required)}`);
            targetRbxPath = targetRbxPath.slice(required.length + 1);
            hasContainerYet = true;
            baseInstanceExpr = f.call(f.index(baseInstanceExpr, f.identifier("FindFirstChild")), undefined, [
              f.string(use),
            ]);
            break;
          }
        }
        if (!hasContainerYet) {
          // TODO: Implement this tomorrow
          throw "Not implemented";
        }

        state.addPrereqStmts(
          f.declareVariable(baseInstance, baseInstanceExpr),
          f.call(f.identifier("assert"), undefined, [baseInstance, f.string("Not found")], true),
        );
      } else {
        state.addPrereqStmt(f.declareVariable(baseInstance, rootInstance));
      }

      const tempVariable = f.identifier("temp", true);
      const tempExpression: ts.Expression = baseInstance;

      for (const segment of targetRbxPath) {
        // tempExpression = useOptionalChains ? f.call(f.optionalIndex()) : f.nonnull(
        //   f.call(f.index(tempExpression, f.identifier("FindFirstChild")), undefined, [f.string(segment)], false),
        // );
      }

      state.addPrereqStmts(
        f.declareVariable(tempVariable, tempExpression),
        f.call(f.identifier("assert"), undefined, [tempVariable, f.string("Not found")], true),
      );

      return tempVariable;
    }

    export function getBooleanValue(expr: ts.BooleanLiteral) {
      return expr.kind === ts.SyntaxKind.TrueKeyword;
    }

    /** This is to avoid injection into the code */
    export function getStringValue(expr: ts.StringLiteralLike) {
      return ts.stripQuotes(expr.getText());
    }

    export function getFileSize(p: string) {
      if (fs.existsSync(p)) {
        const stat = fs.statSync(p);
        if (stat.isFile()) return stat.size;
      }
    }

    export function isDir(p: string): boolean {
      return fs.existsSync(p) && fs.statSync(p).isDirectory();
    }

    export function isFile(p: string): boolean {
      return fs.existsSync(p) && fs.statSync(p).isFile();
    }

    // Windows path system is a bit weird... but unix path system is fine
    export function toEmittedPath(rawPath: string) {
      if (path.sep === "\\") return rawPath.replace(/\\/g, "/");
      else return rawPath;
    }

    export function resolvePath(state: TransformState, node: ts.Node, rawPath: string) {
      const filePath = node.getSourceFile().fileName;

      // '.' - file
      if (rawPath === ".") return filePath;

      // '..' - previous directory
      if (rawPath.startsWith("../")) return path.join(path.join(filePath, ".."), rawPath);

      // './' - current file directory
      if (rawPath.startsWith("./")) return path.join(path.dirname(filePath), rawPath);

      // '<file name>' - project directory
      return path.join(state.project.path, rawPath);
    }
  }

  export function transform<T extends Macro = Macro>(
    state: TransformState,
    node: SecondParameter<T["transform"]>,
    macro: LoadedMacro<T>,
  ): ReturnType<T["transform"]> {
    const [line, column] = getLineAndColumnOfNode(node);
    const macroName = macro.symbol.name;
    Logger.debug(`Found ${macro.kind} macro in line ${line}, column ${column}, name = ${macroName}`);

    if (macro.deprecated) {
      let message = `${macroName} is deprecated.`;
      if (macro.deprecated.message) message += ` ${macro.deprecated.message}`;
      Diagnostics.warn(node, message);
    }

    return Logger.pushTreeWith(() => macro.source.transform(state, node) as ReturnType<T["transform"]>);
  }
}

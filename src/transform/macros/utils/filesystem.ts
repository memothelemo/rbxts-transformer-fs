import { f } from "@transformer/main/factory";
import { TransformState } from "@transformer/main/state";
import { TransformConfig } from "@transformer/shared/config";
import { PACKAGE_NAME } from "@transformer/shared/consts";
import Diagnostics from "@transformer/shared/services/diagnostics";
import Logger from "@transformer/shared/services/logger";
import { assert } from "@transformer/shared/util/assert";
import { humanifyFileSize } from "@transformer/shared/util/humanifyFileSize";

import fs from "fs";
import path from "path";
import ts from "typescript";

export namespace macroFsUtils {
  export enum FileSizeCheckMode {
    Reading,
    Hashing,
  }

  export function checkOrThrowFileSizeLimit(
    path: string,
    config: TransformConfig,
    mode: FileSizeCheckMode,
    source_node: ts.Node,
  ) {
    let size_limit: number;
    let classification: string;
    let property: string;
    switch (mode) {
      case FileSizeCheckMode.Hashing:
        size_limit = config.hashFileSizeLimit;
        classification = "hash";
        property = "hashFileSizeLimit";
        break;
      case FileSizeCheckMode.Reading:
        size_limit = config.readFileSizeLimit;
        classification = "read";
        property = "readFileSizeLimit";
        break;
      default:
        const message = `FileSizeCheckMode.${FileSizeCheckMode[mode]} is not implemented for "checkFileSizeLimits"`;
        assert(false, message);
    }

    const current_file_size = getFileSize(path);
    Logger.debugValue("current_file_size", () => humanifyFileSize(current_file_size));

    if (current_file_size > size_limit) {
      const human_current_size = humanifyFileSize(current_file_size);
      const human_size_limit = humanifyFileSize(size_limit);
      Diagnostics.error(
        source_node,
        `This file reached the ${classification} file size limit! (${human_current_size} > ${human_size_limit})`,
        `If you want to increase the ${classification} file size, set "${property}" to bigger amount in bytes.`,
        `in tsconfig.json file inside the where you configured for ${PACKAGE_NAME}.`,
      );
    }
  }

  export function buildFixedPathString(raw_path: string) {
    // Windows path system is a bit weird...
    if (path.sep === "\\") {
      raw_path = raw_path.replace(/\\/g, "/");
    }
    return f.string(raw_path);
  }

  export function existsMacroImpl(
    state: TransformState,
    node: ts.CallExpression,
    checker: (path: string) => boolean,
  ) {
    const first_argument = node.arguments[0];
    if (!f.is.string(first_argument))
      Diagnostics.error(first_argument ?? node, "Expected path as string");

    const path = resolvePathArgument(state, node, f.value.string(first_argument));
    Logger.debugValue("path", () => state.project.relative_path_to(path));

    // Generalize the boolean literal type as boolean type otherwise
    // TypeScript recognize the type of value as a value of the boolean itself.
    return f.as(f.bool(checker(path)), f.types.reference("boolean"));
  }

  export function getFileSize(path: string) {
    return fs.statSync(path).size;
  }

  export function isDirectory(path: string) {
    return fs.existsSync(path) && fs.statSync(path).isDirectory();
  }

  export function isFile(path: string) {
    return fs.existsSync(path) && fs.statSync(path).isFile();
  }

  export function resolvePathArgument(state: TransformState, node: ts.Node, value: string) {
    const file_path = state.getSourceFileOfNode(node).fileName;

    // current source file of where the argument originates
    if (value === ".") return file_path;

    // '..' - previous directory away from the source file path
    if (value.startsWith("..")) return path.join(file_path, value);

    // './' - current file directory
    if (value.startsWith("./")) return path.join(path.dirname(file_path), value);

    // root/absolute locations
    if (path.isAbsolute(value)) return value;

    // '<file name>' - project root directory
    //
    // TODO: do something with multiplace games and non-game projects
    return path.join(state.project.directory_path, value);
  }
}

import { f } from "@transformer/main/factory";
import { TransformState } from "@transformer/main/state";
import Diagnostics from "@transformer/shared/services/diagnostics";
import Logger from "@transformer/shared/services/logger";

import fs from "fs";
import ts from "typescript";

import { macroFsUtils } from "../utils/filesystem";
import { NonValueCallMacro } from "../types";

function base_impl(
  state: TransformState,
  node: ts.CallExpression,
  checker: (path: string) => boolean,
) {
  const first_argument = node.arguments[0];
  if (!f.is.string(first_argument))
    Diagnostics.error(first_argument ?? node, "Expected path as string");

  const second_argument = node.arguments.at(1);
  let error_message = "Specified path not found";

  if (second_argument !== undefined) {
    if (!f.is.string(second_argument)) Diagnostics.error(second_argument, "Invalid error message");
    if (!second_argument) Diagnostics.error(second_argument, "Error message is empty");
    error_message = f.value.string(second_argument);
  }

  const path = macroFsUtils.resolvePathArgument(state, node, f.value.string(first_argument));
  Logger.debugValue("path", () => state.project.relative_path_to(path));

  const exists = checker(path);
  Logger.debugValue("exists", exists);

  if (!exists) Diagnostics.error(first_argument, error_message);
}

export const ExpectPathMacro: NonValueCallMacro = {
  getSymbol(state) {
    return state.symbol_provider.module_file.expect("$expectPath");
  },

  transform(state, node) {
    base_impl(state, node, fs.existsSync);
    return undefined;
  },
};

export const ExpectDirMacro: NonValueCallMacro = {
  getSymbol(state) {
    return state.symbol_provider.module_file.expect("$expectDir");
  },

  transform(state, node) {
    base_impl(state, node, macroFsUtils.isDirectory);
    return undefined;
  },
};

export const ExpectFileMacro: NonValueCallMacro = {
  getSymbol(state) {
    return state.symbol_provider.module_file.expect("$expectFile");
  },

  transform(state, node) {
    base_impl(state, node, macroFsUtils.isFile);
    return undefined;
  },
};

import Diagnostics from "@transformer/shared/services/diagnostics";
import Logger from "@transformer/shared/services/logger";
import { assert } from "@transformer/shared/util/assert";

import { TransformState } from "../state";
import { CallMacro, Macro, NonValueCallMacro, VariableMacro } from "./types";

import { HashFileMacro } from "./call/hash";
import { ReadFileMacro } from "./call/read";
import { DirExistsMacro, FileExistsMacro, PathExistsMacro } from "./call/exists";

import { FileNameMacro } from "./variable/fileName";
import { ExpectDirMacro, ExpectFileMacro, ExpectPathMacro } from "./nonValueCall/expect";
import { FindInstanceCallMacro, InstanceCallMacro } from "./call/instance";

export const NON_VALUE_CALL_MACROS = new Array<NonValueCallMacro>(
  ExpectDirMacro,
  ExpectFileMacro,
  ExpectPathMacro,
);

export const CALL_MACROS = new Array<CallMacro>(
  HashFileMacro,
  ReadFileMacro,

  DirExistsMacro,
  FileExistsMacro,
  PathExistsMacro,

  InstanceCallMacro,
  FindInstanceCallMacro,
);

export const VARIABLE_MACROS = new Array<VariableMacro>(FileNameMacro);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SecondParameter<T> = T extends (first: any, second: infer A, ...args: any) => any ? A : any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThirdParameter<T> = T extends (first: any, second: any, third: infer A, ...args: any) => any
  ? A
  : // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any;

export function transformMacro<T extends Macro>(
  state: TransformState,
  macro: T,
  node: SecondParameter<T["transform"]>,
  symbol: ThirdParameter<T["transform"]>,
): ReturnType<T["transform"]> {
  const name = macro._resolved_name;
  assert(name, "cannot resolve name of the macro");

  if (macro._deprecated !== undefined) {
    let message = `${name} is deprecated.`;
    if (macro._deprecated !== true) message += ` ${macro._deprecated}`;
    Diagnostics.warn(node, message);
  }

  const resolved = Logger.benchmark(
    () => {
      const { line, column } = state.getLineAndColumnOfNode(node);
      return `Transforming ${macro._resolved_name} variable macro from line ${line}, column ${column}`;
    },
    () => macro.transform(state, node, symbol),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return resolved as any;
}

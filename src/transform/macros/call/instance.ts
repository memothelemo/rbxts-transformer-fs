import { f } from "@transformer/main/factory";
import Diagnostics from "@transformer/shared/services/diagnostics";

import { macroFsUtils } from "../utils/filesystem";
import { macroRbxInstanceUtils } from "../utils/instance";
import { CallMacro } from "../types";
import { RbxPathParent } from "@roblox-ts/rojo-resolver";
import { assert } from "@transformer/shared/util/assert";
import ts from "typescript";

export const FindInstanceCallMacro: CallMacro = {
  getSymbol(state) {
    const symbol = state.symbol_provider.module_file.find_instance;
    return [symbol.call_symbol, symbol.exact_call_symbol];
  },

  transform(state, node, source_symbol) {
    const first_argument = node.arguments[0];
    if (!f.is.string(first_argument)) {
      Diagnostics.error(first_argument ?? node, "Expected file path as string");
    }

    const path = macroFsUtils.resolvePathArgument(
      state,
      first_argument,
      f.value.string(first_argument),
    );
    const exact_call_symbol = state.symbol_provider.module_file.instance.exact_call_symbol;
    const use_exact_path = source_symbol === exact_call_symbol;

    const rbx_path = macroRbxInstanceUtils.resolveRbxPath(
      state,
      source_symbol.name,
      node,
      path,
      use_exact_path,
    );

    // Implementing $findInstance is actually easy, we can just spam with
    // FindFirstChild (unless it is not applicable to use one)
    let expression = macroRbxInstanceUtils.createRootFromResolvedPath(rbx_path);
    for (const part of rbx_path.slice(1)) {
      assert(part !== macroRbxInstanceUtils.ScriptMarker);
      if (part === RbxPathParent) {
        expression = f.field(expression, f.identifier("Parent"), false);
        continue;
      }
      expression = f.call.chain(
        f.field.optional(expression, f.identifier("FindFirstChild"), false),
        undefined,
        undefined,
        [f.string(part)],
      );
    }

    const temporary_var = f.identifier("_instance", true);
    const statement = f.stmt.declareVariable(temporary_var, true, undefined, expression);
    state.addPrereqStmt(statement);

    return temporary_var;
  },
};

export const InstanceCallMacro: CallMacro = {
  getSymbol(state) {
    const symbol = state.symbol_provider.module_file.instance;
    return [symbol.call_symbol, symbol.exact_call_symbol];
  },

  transform(state, node, source_symbol) {
    const first_argument = node.arguments[0];
    if (!f.is.string(first_argument)) {
      Diagnostics.error(first_argument ?? node, "Expected file path as string");
    }

    const path = macroFsUtils.resolvePathArgument(
      state,
      first_argument,
      f.value.string(first_argument),
    );
    const exact_call_symbol = state.symbol_provider.module_file.instance.exact_call_symbol;
    const use_exact_path = source_symbol === exact_call_symbol;

    const rbxPath = macroRbxInstanceUtils.resolveRbxPath(
      state,
      source_symbol.name,
      node,
      path,
      use_exact_path,
    );

    Diagnostics.error(node, "Not implemented");
  },
};

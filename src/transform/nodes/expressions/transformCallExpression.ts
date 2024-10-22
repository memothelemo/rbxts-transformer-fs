import { transformMacro } from "@transformer/main/macros";
import { TransformState } from "@transformer/main/state";
import Diagnostics from "@transformer/shared/services/diagnostics";

import ts from "typescript";
import { transformNode } from "../transformNode";

export function transformCallExpression(
  state: TransformState,
  node: ts.CallExpression,
): ts.Expression {
  const symbol = state.getSymbol(node.expression, true);
  if (symbol) {
    const macro = state.macro_manager.getCallMacro(symbol);
    if (macro) return transformMacro(state, macro, node, symbol);

    // non-value call macros are also call macros but they
    // do not emit/transform into a value so we need throw
    // an error to the user that this macro is not permitted
    // to use as a value.
    const invalid_use_macro = state.macro_manager.getNonValueCallMacro(symbol);
    if (invalid_use_macro) {
      Diagnostics.error(node, `${invalid_use_macro._resolved_name!} should not be used as value!`);
    }
  }
  return ts.visitEachChild(node, new_node => transformNode(state, new_node), state.ts_context);
}

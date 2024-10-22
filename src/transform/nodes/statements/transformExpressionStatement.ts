import { transformMacro } from "@transformer/main/macros";
import { TransformState } from "@transformer/main/state";
import { overrideAsArray } from "@transformer/shared/util/overrideAsArray";

import ts from "typescript";
import { transformNode } from "../transformNode";

export function transformExpressionStatement(
  state: TransformState,
  node: ts.ExpressionStatement,
): ts.ExpressionStatement | ts.Statement[] {
  const inner = node.expression;
  if (ts.isCallExpression(inner)) {
    const symbol = state.getSymbol(inner.expression, true);
    if (symbol) {
      const macro = state.macro_manager.getNonValueCallMacro(symbol);
      if (macro) {
        const result = transformMacro(state, macro, inner, symbol);
        return overrideAsArray(result);
      }
    }
  }

  return ts.visitEachChild(node, new_node => transformNode(state, new_node), state.ts_context);
}

import { VariableAccessExpression } from "@transformer/main/macros/types";
import { transformMacro } from "@transformer/main/macros";
import { TransformState } from "@transformer/main/state";

import ts from "typescript";
import { transformNode } from "../transformNode";

export function transformVariableAccessExpression(
  state: TransformState,
  node: VariableAccessExpression,
): ts.Expression {
  let accessor: ts.Expression = node;
  if (ts.isPropertyAccessExpression(node)) {
    accessor = node.name;
  } else if (ts.isElementAccessExpression(node)) {
    accessor = node.argumentExpression;
  } else if (node.parent.kind === ts.SyntaxKind.ImportSpecifier) {
    // TODO: check even further with this condition
    return node;
  }

  const symbol = state.getSymbol(accessor, true);
  if (symbol) {
    const macro = state.macro_manager.getVariableMacro(symbol);
    if (macro) return transformMacro(state, macro, node, symbol);
  }

  return ts.visitEachChild(node, new_node => transformNode(state, new_node), state.ts_context);
}

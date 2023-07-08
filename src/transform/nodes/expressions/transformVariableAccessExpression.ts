import { TransformState } from "transform/classes/TransformState";
import { macros } from "transform/macros";
import { VariableAccessExpression } from "transform/macros/types";
import ts from "typescript";
import { transformChildren } from "../transformChildren";

export function transformVariableAccessExpression(state: TransformState, node: VariableAccessExpression) {
  let accessor: ts.Expression = node;
  if (ts.isPropertyAccessExpression(node)) {
    accessor = node.name;
  } else if (ts.isElementAccessExpression(node)) {
    accessor = node.argumentExpression;
  } else if (node.parent.kind === ts.SyntaxKind.ImportSpecifier) {
    // Bug fix
    return node;
  }

  const symbol = state.getSymbol(accessor, true);
  if (symbol) {
    const macro = state.macros.getVariableMacro(symbol);
    if (macro) return macros.transform(state, node, macro);
  }

  return transformChildren(state, node);
}

import ts from "typescript";
import { TransformState } from "transform/classes/TransformState";
import { transformChildren } from "../transformChildren";
import { Logger } from "core/classes/Logger";
import { macros } from "transform/macros/macros";
import { VariableLikeExpression } from "transform/types";
import { isNodeAncestorOf } from "transform/utils/isNodeAncestorOf";

export function transformVariableLikeExpression(state: TransformState, node: VariableLikeExpression) {
  let accessor: ts.Expression = node;
  if (ts.isPropertyAccessExpression(node)) {
    accessor = node.name;
  } else if (ts.isElementAccessExpression(node)) {
    accessor = node.argumentExpression;
  } else if (isNodeAncestorOf(node, ts.isImportDeclaration)) {
    // Caveat when we tried to transform identifiers
    return node;
  }

  const symbol = state.getSymbol(accessor, true);
  if (symbol) {
    const macro = state.macroManager.getVariableMacro(symbol);
    if (macro) {
      macros.preTransform("variable", node, symbol, macro);

      const result = Logger.pushTreeWith(() => macro.transform(state, node));
      if (result !== undefined) return result;

      Logger.debug("Result returned undefined, falling back to the original node");
    }
  }

  return transformChildren(state, node);
}

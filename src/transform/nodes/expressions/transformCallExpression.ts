import { Logger } from "core/classes/Logger";
import { TransformState } from "transform/classes/TransformState";
import { macros } from "transform/macros/macros";
import ts from "typescript";
import { transformChildren } from "../transformChildren";

export function transformCallExpression(state: TransformState, expr: ts.CallExpression): ts.Expression {
  // Attempting to find that macro
  const symbol = state.getSymbol(expr.expression, true);
  if (symbol) {
    const macro = state.macroManager.getCallMacro(symbol);
    if (macro) {
      macros.preTransform("call", expr, symbol, macro);

      const result = Logger.pushTreeWith(() => macro.transform(state, expr));
      if (result !== undefined) return result;

      Logger.debug("Result returned undefined, falling back to the original node");
    }
  }
  return transformChildren(state, expr);
}

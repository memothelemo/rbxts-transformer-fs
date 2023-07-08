import { TransformState } from "transform/classes/TransformState";
import { macros } from "transform/macros";
import ts from "typescript";
import { transformChildren } from "../transformChildren";

export function transformCallExpression(state: TransformState, expr: ts.CallExpression): ts.Expression {
  const symbol = state.getSymbol(expr.expression, true);
  if (symbol) {
    const macro = state.macros.getCallMacro(symbol);
    if (macro) return macros.transform(state, expr, macro);
  }
  return transformChildren(state, expr);
}

import { catchDiagnostic } from "shared/utils/diagnostics";
import { TransformState } from "transform/classes/TransformState";
import ts from "typescript";
import { transformCallExpression } from "./expressions/transformCallExpression";
import { transformVariableAccessExpression } from "./expressions/transformVariableAccessExpression";
import { transformChildren } from "./transformChildren";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TRANSFORMERS = new Map<ts.SyntaxKind, (state: TransformState, node: any) => ts.Expression>([
  [ts.SyntaxKind.Identifier, transformVariableAccessExpression],
  [ts.SyntaxKind.PropertyAccessExpression, transformVariableAccessExpression],
  [ts.SyntaxKind.ElementAccessExpression, transformVariableAccessExpression],
  [ts.SyntaxKind.CallExpression, transformCallExpression],
]);

export function transformExpression(state: TransformState, expression: ts.Expression): ts.Expression {
  return catchDiagnostic(expression, () => {
    const transformer = TRANSFORMERS.get(expression.kind);
    if (transformer !== undefined) {
      return transformer(state, expression);
    }
    return transformChildren(state, expression);
  });
}

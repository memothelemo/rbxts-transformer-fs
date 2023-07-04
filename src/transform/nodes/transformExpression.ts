import { TransformState } from "transform/classes/TransformState";
import { catchDiagnostic } from "transform/utils/diagnostics";
import ts from "typescript";
import { transformCallExpression } from "./expressions/transformCallExpression";
import { transformVariableLikeExpression } from "./expressions/transformVariableLikeExpression";
import { transformChildren } from "./transformChildren";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TRANSFORMERS = new Map<ts.SyntaxKind, (state: TransformState, node: any) => ts.Expression>([
  [ts.SyntaxKind.CallExpression, transformCallExpression],
  [ts.SyntaxKind.PropertyAccessExpression, transformVariableLikeExpression],
  [ts.SyntaxKind.ElementAccessExpression, transformVariableLikeExpression],
  [ts.SyntaxKind.Identifier, transformVariableLikeExpression],
]);

export function transformExpression(state: TransformState, expression: ts.Expression): ts.Expression {
  return catchDiagnostic(expression, () => {
    const transformer = TRANSFORMERS.get(expression.kind);
    return transformer === undefined ? transformChildren(state, expression) : transformer(state, expression);
  });
}

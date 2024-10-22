import { catchDiagnostic } from "@transformer/shared/util/catchDiagnostic";
import ts from "typescript";

import { TransformState } from "../state";
import { transformNode } from "./transformNode";
import { transformVariableAccessExpression } from "./expressions/transformVariableAccessExpression";
import { transformCallExpression } from "./expressions/transformCallExpression";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TRANSFORMERS = new Map<ts.SyntaxKind, (state: TransformState, node: any) => ts.Expression>([
  [ts.SyntaxKind.Identifier, transformVariableAccessExpression],
  [ts.SyntaxKind.PropertyAccessExpression, transformVariableAccessExpression],
  [ts.SyntaxKind.ElementAccessExpression, transformVariableAccessExpression],
  [ts.SyntaxKind.CallExpression, transformCallExpression],
]);

export function transformExpression(
  state: TransformState,
  expression: ts.Expression,
): ts.Expression {
  return catchDiagnostic(expression, () => {
    const transformer = TRANSFORMERS.get(expression.kind);
    if (transformer) return transformer(state, expression);

    return ts.visitEachChild(
      expression,
      new_node => transformNode(state, new_node),
      state.ts_context,
    );
  });
}

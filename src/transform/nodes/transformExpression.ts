import Diagnostics from "@shared/services/diagnostics";
import { State } from "@transform/state";
import ts from "typescript";
import { transformCallExpression } from "./expressions/transformCallExpression";
import { transformIdentifier } from "./expressions/transformIdentifier";
import { transformPropertyAccessExpression } from "./expressions/transformPropertyAccessExpression";
import { transformElementAccessExpression } from "./expressions/transformElementAccessExpression";

export type TransformExprResult = ts.Expression;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Transformer = (state: State, node: any) => TransformExprResult;

const TRANSFORMERS = new Map<ts.SyntaxKind, Transformer>([
    [ts.SyntaxKind.CallExpression, transformCallExpression],
    [ts.SyntaxKind.ElementAccessExpression, transformElementAccessExpression],
    [ts.SyntaxKind.Identifier, transformIdentifier],
    [ts.SyntaxKind.PropertyAccessExpression, transformPropertyAccessExpression],
]);

export function transformExpression(state: State, expression: ts.Expression): TransformExprResult {
    return Diagnostics.capture<TransformExprResult>(expression, () => {
        const transformer = TRANSFORMERS.get(expression.kind);
        if (transformer) return transformer(state, expression);
        return state.transformChildrenOfNode(expression);
    });
}

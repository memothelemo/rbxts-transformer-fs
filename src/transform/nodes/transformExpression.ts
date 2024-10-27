import Diagnostics, { DiagnosticError } from "@shared/services/diagnostics";
import { State } from "@transform/state";
import ts from "typescript";
import { transformCallExpression } from "./expressions/transformCallExpression";
import { transformIdentifier } from "./expressions/transformIdentifier";
import { transformPropertyAccessExpression } from "./expressions/transformPropertyAccessExpression";
import { transformElementAccessExpression } from "./expressions/transformElementAccessExpression";
import { f } from "@transform/factory";
import Logger from "@shared/services/logger";

export type TransformExprResult = ts.Expression;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Transformer = (state: State, node: any) => TransformExprResult;

const TRANSFORMERS = new Map<ts.SyntaxKind, Transformer>([
    [ts.SyntaxKind.CallExpression, transformCallExpression],
    [ts.SyntaxKind.ElementAccessExpression, transformElementAccessExpression],
    [ts.SyntaxKind.Identifier, transformIdentifier],
    [ts.SyntaxKind.PropertyAccessExpression, transformPropertyAccessExpression],
]);

// Unlike statements, we need to get a parent that is a statement and check
// if that statement expects a transformer error by a JSDoc tag.
function expectsTestingError(state: State, node: ts.Node): boolean {
    while (node !== undefined && !ts.isStatement(node)) {
        node = node.parent;
    }
    return state.expectsTestingError(node);
}

export function transformExpression(state: State, expression: ts.Expression): TransformExprResult {
    let gotDiagnosticError = false;
    const output = Diagnostics.capture<TransformExprResult>(expression, () => {
        const transformer = TRANSFORMERS.get(expression.kind);
        if (transformer) {
            const lastStack = Logger.getDepth();
            try {
                return transformer(state, expression);
            } catch (error) {
                Logger.resetDepth(lastStack);

                if (!(error instanceof DiagnosticError)) throw error;
                if (!expectsTestingError(state, expression)) throw error;
                gotDiagnosticError = true;

                const undefined_var = f.identifier("_value", true);
                const stmt = f.stmt.declareVariable(undefined_var, true, undefined, f.nil());
                state.prereq(stmt);
                state.commentNode(stmt, ` got error: ${error.message}`, false);
                return undefined_var;
            }
        }
        return state.transformChildrenOfNode(expression);
    });

    // successful test error check
    if (expectsTestingError(state, expression) && gotDiagnosticError)
        Diagnostics.error(expression, "Unexpected successful case");

    return output;
}

import Diagnostics, { DiagnosticError } from "@shared/services/diagnostics";
import { getNodeList } from "@shared/util/getNodeList";
import { State } from "@transform/state";
import ts from "typescript";
import { transformExpressionStatement } from "./statements/transformExpressionStatement";
import { f } from "@transform/factory";
import Logger from "@shared/services/logger";
import { transformBlock } from "./statements/transformBlock";

export type TransformStmtResult = ts.Statement | ts.Statement[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Transformer = (state: State, node: any) => TransformStmtResult;

const TRANSFORMERS = new Map<ts.SyntaxKind, Transformer>([
    [ts.SyntaxKind.Block, transformBlock],
    [ts.SyntaxKind.ExpressionStatement, transformExpressionStatement],
]);

function baseTransformStatement(state: State, statement: ts.Statement): TransformStmtResult {
    const [node, prereqs] = state.capture(() => {
        const transformer = TRANSFORMERS.get(statement.kind);
        if (transformer) return transformer(state, statement);
        return state.transformChildrenOfNode(statement);
    });
    return [...prereqs, ...getNodeList(node)];
}

export function transformStatement(state: State, statement: ts.Statement): TransformStmtResult {
    let gotSuccessfulCase = false;
    return Diagnostics.capture<TransformStmtResult>(statement, () => {
        const lastStack = Logger.getDepth();
        try {
            const output = baseTransformStatement(state, statement);

            // successful test error check
            gotSuccessfulCase = state.expectsTestingError(statement);
            if (gotSuccessfulCase) Diagnostics.error(statement, "Unexpected successful case");

            return output;
        } catch (error) {
            Logger.resetDepth(lastStack);
            // Checking whether we need to capture the diagnostic and eliminate the
            // statement if testing mode is enabled and the statement is expecting
            // an error.
            if (!(error instanceof DiagnosticError)) throw error;
            if (gotSuccessfulCase || !state.expectsTestingError(statement)) throw error;

            const emptyBlock = f.stmt.block([]);
            state.commentNode(emptyBlock, ` got error: ${error.message}`);
            return emptyBlock;
        }
    });
}

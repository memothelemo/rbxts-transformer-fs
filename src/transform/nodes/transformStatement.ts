import Diagnostics from "@shared/services/diagnostics";
import { getNodeList } from "@shared/util/getNodeList";
import { State } from "@transform/state";
import ts from "typescript";
import { transformExpressionStatement } from "./statements/transformExpressionStatement";

export type TransformStmtResult = ts.Statement | ts.Statement[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Transformer = (state: State, node: any) => TransformStmtResult;

const TRANSFORMERS = new Map<ts.SyntaxKind, Transformer>([
    [ts.SyntaxKind.ExpressionStatement, transformExpressionStatement],
]);

export function transformStatement(state: State, statement: ts.Statement): TransformStmtResult {
    return Diagnostics.capture<TransformStmtResult>(statement, () => {
        const [node, prereqs] = state.capture(() => {
            const transformer = TRANSFORMERS.get(statement.kind);
            if (transformer) return transformer(state, statement);
            return state.transformChildrenOfNode(statement);
        });
        return [...prereqs, ...getNodeList(node)];
    });
}

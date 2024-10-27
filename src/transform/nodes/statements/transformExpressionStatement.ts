import { State } from "@transform/state";
import ts from "typescript";
import { TransformStmtResult } from "../transformStatement";
import { getNodeList } from "@shared/util/getNodeList";
import { transformMacro } from "../transformMacro";

export function transformExpressionStatement(
    state: State,
    node: ts.ExpressionStatement,
): TransformStmtResult {
    const inner = node.expression;
    if (ts.isCallExpression(inner)) {
        const symbol = state.getSymbol(inner.expression, true);
        if (symbol) {
            const macro = state.macroManager.getStatementCallMacro(symbol);
            if (macro) {
                const result = transformMacro(state, macro, inner, symbol) ?? [];
                return getNodeList(result);
            }
        }
    }
    return state.transformChildrenOfNode(node);
}

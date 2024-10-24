import { State } from "@transform/state";
import ts from "typescript";
import { TransformExprResult } from "../transformExpression";
import { transformMacro } from "../transformMacro";

export function transformCallExpression(
    state: State,
    node: ts.CallExpression,
): TransformExprResult {
    const symbol = state.getSymbol(node.expression, true);
    if (symbol) {
        const macro = state.macroManager.getCallMacro(symbol);
        if (macro) return transformMacro(state, macro, node, symbol);
    }
    return state.transformChildrenOfNode(node);
}

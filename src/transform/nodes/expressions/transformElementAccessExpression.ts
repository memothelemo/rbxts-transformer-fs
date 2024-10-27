import { State } from "@transform/state";
import ts from "typescript";
import { TransformExprResult } from "../transformExpression";
import { transformMacro } from "../transformMacro";

export function transformElementAccessExpression(
    state: State,
    node: ts.ElementAccessExpression,
): TransformExprResult {
    const symbol = state.getSymbol(node.argumentExpression, true);
    if (symbol) {
        const macro = state.macroManager.getVariableMacro(symbol);
        if (macro) return transformMacro(state, macro, node, symbol);
    }
    return state.transformChildrenOfNode(node);
}

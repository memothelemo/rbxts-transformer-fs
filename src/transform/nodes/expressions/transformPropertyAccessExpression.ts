import { State } from "@transform/state";
import ts from "typescript";
import { TransformExprResult } from "../transformExpression";
import { transformMacro } from "../transformMacro";

export function transformPropertyAccessExpression(
    state: State,
    node: ts.PropertyAccessExpression,
): TransformExprResult {
    const symbol = state.getSymbol(node.name, true);
    if (symbol) {
        const macro = state.macroManager.getVariableMacro(symbol);
        if (macro) return transformMacro(state, macro, node, symbol);
    }
    return state.transformChildrenOfNode(node);
}

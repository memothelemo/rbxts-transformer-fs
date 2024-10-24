import { State } from "@transform/state";
import ts from "typescript";
import { TransformExprResult } from "../transformExpression";
import { transformMacro } from "../transformMacro";

export function transformIdentifier(state: State, node: ts.Identifier): TransformExprResult {
    const symbol = state.getSymbol(node, true);
    if (symbol) {
        const macro = state.macroManager.getVariableMacro(symbol);
        if (macro) return transformMacro(state, macro, node, symbol);
    }
    return state.transformChildrenOfNode(node);
}

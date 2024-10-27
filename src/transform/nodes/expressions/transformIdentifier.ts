import { State } from "@transform/state";
import ts from "typescript";
import { TransformExprResult } from "../transformExpression";
import { transformMacro } from "../transformMacro";

export function transformIdentifier(state: State, node: ts.Identifier): TransformExprResult {
    // Don't try to transform it if the parent is in the import specifier
    if (node.parent.kind === ts.SyntaxKind.ImportSpecifier) {
        // TODO: check even further with this condition
        return node;
    }

    const symbol = state.getSymbol(node, true);
    if (symbol) {
        const macro = state.macroManager.getVariableMacro(symbol);
        if (macro) return transformMacro(state, macro, node, symbol);
    }

    return state.transformChildrenOfNode(node);
}

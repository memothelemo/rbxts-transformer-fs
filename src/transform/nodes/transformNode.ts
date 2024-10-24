import { State } from "@transform/state";
import ts from "typescript";
import { transformExpression } from "./transformExpression";
import { transformStatement } from "./transformStatement";

export function transformNode(state: State, node: ts.Node): ts.Node | ts.Statement[] {
    if (ts.isExpression(node)) {
        return transformExpression(state, node);
    } else if (ts.isStatement(node)) {
        return transformStatement(state, node);
    }
    return state.transformChildrenOfNode(node);
}

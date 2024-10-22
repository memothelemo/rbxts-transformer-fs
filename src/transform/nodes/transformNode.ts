import ts from "typescript";
import { TransformState } from "../state";
import { transformExpression } from "./transformExpression";
import { transformStatement } from "./transformStatement";

export function transformNode(state: TransformState, node: ts.Node): ts.Node | ts.Statement[] {
  if (ts.isExpression(node)) {
    return transformExpression(state, node);
  } else if (ts.isStatement(node)) {
    return transformStatement(state, node);
  }
  return ts.visitEachChild(node, new_node => transformNode(state, new_node), state.ts_context);
}

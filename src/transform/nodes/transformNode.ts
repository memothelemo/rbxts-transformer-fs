import { TransformState } from "transform/classes/TransformState";
import ts from "typescript";
import { transformChildren } from "./transformChildren";
import { transformExpression } from "./transformExpression";
import { transformStatement } from "./transformStatement";

export function transformNode(state: TransformState, node: ts.Node) {
  if (ts.isExpression(node)) {
    return transformExpression(state, node);
  } else if (ts.isStatement(node)) {
    return transformStatement(state, node);
  }
  return transformChildren(state, node);
}

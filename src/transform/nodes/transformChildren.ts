import { TransformState } from "transform/classes/TransformState";
import ts from "typescript";
import { transformNode } from "./transformNode";

export function transformChildren<T extends ts.Node = ts.Node>(state: TransformState, node: T): T {
  return ts.visitEachChild(node, child => transformNode(state, child), state.context);
}

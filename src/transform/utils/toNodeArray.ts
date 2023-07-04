import ts from "typescript";

export function toNodeArray<T extends ts.Node>(node: T | ReadonlyArray<T>): T[] {
  return Array.isArray(node) ? node : [node];
}

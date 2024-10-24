import ts from "typescript";

export function getNodeList<T extends ts.Node>(node: T | T[]): T[] {
    return Array.isArray(node) ? node : [node];
}

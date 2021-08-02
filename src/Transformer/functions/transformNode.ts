import ts from "typescript";
import { transformExpression } from "../expressions";
import { TransformState } from "../state";
import { transformStatement } from "../statements";

export function transformNode(state: TransformState, node: ts.Node): ts.Node;
export function transformNode(state: TransformState, node: ts.Node) {
	if (ts.isStatement(node)) {
		return transformStatement(state, node);
	}
	if (ts.isExpression(node)) {
		return transformExpression(state, node);
	}
	return node;
}

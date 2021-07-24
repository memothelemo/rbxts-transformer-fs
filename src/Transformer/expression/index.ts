import ts from "byots";
import { TransformState } from "../state";
import { transformCallExpression } from "./callExpression";

export function transformExpression(
	state: TransformState,
	node: ts.Expression,
) {
	if (ts.isCallExpression(node)) {
		return transformCallExpression(state, node);
	}
	return node;
}

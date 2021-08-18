import ts from "typescript";
import { TransformContext } from "../../context";
import { transformCallExpression } from "../expressions/transformCallExpression";

export function transformExpression(
	context: TransformContext,
	node: ts.Expression,
) {
	// optimization purposes
	switch (node.kind) {
		case ts.SyntaxKind.CallExpression:
			return transformCallExpression(context, node as ts.CallExpression);
		default:
			return node;
	}
}

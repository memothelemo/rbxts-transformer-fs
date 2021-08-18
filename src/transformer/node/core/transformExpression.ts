import ts from "typescript";
import { TransformContext } from "../../context";
import { transformCallExpression } from "../expressions/transformCallExpression";
import { transformIdentifier } from "../expressions/transformIdentifier";

export function transformExpression(
	context: TransformContext,
	node: ts.Expression,
) {
	// optimization purposes
	switch (node.kind) {
		case ts.SyntaxKind.CallExpression:
			return transformCallExpression(context, node as ts.CallExpression);
		case ts.SyntaxKind.Identifier:
			return transformIdentifier(context, node as ts.Identifier);
		default:
			return node;
	}
}

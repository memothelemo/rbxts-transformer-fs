import ts from "typescript";
import { TransformContext } from "../../context";
import { transformExpression } from "./transformExpression";
import { transformStatement } from "./transformStatement";

export function transformNode(context: TransformContext, node: ts.Node) {
	if (ts.isExpression(node)) {
		return transformExpression(context, node);
	} else if (ts.isStatement(node)) {
		return transformStatement(context, node);
	}
	return node;
}

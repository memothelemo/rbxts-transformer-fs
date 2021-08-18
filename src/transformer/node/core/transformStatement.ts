import ts from "typescript";
import { TransformContext } from "../../context";

export function transformStatement(context: TransformContext, node: ts.Statement) {
	return node;
}

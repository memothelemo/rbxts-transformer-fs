import ts from "typescript";
import { TransformContext } from "../../context";
import { transformImportDeclaration } from "../statements/transformImportDeclaration";

export function transformStatement(context: TransformContext, node: ts.Statement) {
	// optimization
	switch (node.kind) {
		case ts.SyntaxKind.ImportDeclaration:
			return transformImportDeclaration(context, node as ts.ImportDeclaration);
		default:
			return node;
	}
}

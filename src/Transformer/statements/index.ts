import ts from "typescript";
import { TransformState } from "../state";
import { transformImportDeclaration } from "./import";

export function transformStatement(state: TransformState, node: ts.Statement) {
	if (ts.isImportDeclaration(node)) {
		return transformImportDeclaration(state, node);
	}
	return node;
}

import ts from "byots";
import { TransformState } from "../state";
import { transformClassDeclaration } from "./class";

export function transformStatement(state: TransformState, node: ts.Statement) {
	if (ts.isClassDeclaration(node)) {
		return transformClassDeclaration(state, node);
	}
	return node;
}

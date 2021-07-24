import ts from "byots";
import { transformCallExpression } from "../expression/callExpression";
import { TransformState } from "../state";
import { transformImportDeclaration } from "../statement/import";

// i'm kinda regret doing this kind of structure
// i might consider restructing it
function transformNode(state: TransformState, node: ts.Node): ts.Node;
function transformNode(state: TransformState, node: ts.Node) {
	if (ts.isImportDeclaration(node)) {
		return transformImportDeclaration(state, node);
	}

	if (ts.isCallExpression(node)) {
		return transformCallExpression(state, node);
	}

	return node;
}

export function transformSourceFile(
	state: TransformState,
	sourceFile: ts.SourceFile,
): ts.SourceFile {
	const visitNode: ts.Visitor = (node: ts.Node) => {
		return ts.visitEachChild(
			transformNode(state, node),
			child => visitNode(child),
			state.context,
		);
	};

	sourceFile = ts.visitEachChild(sourceFile, visitNode, state.context);
	return sourceFile;
}

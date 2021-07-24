import ts from "byots";
import { TransformState } from "../state";
import { transformNode } from "./transformNode";

export function transformSourceFile(
	state: TransformState,
	sourceFile: ts.SourceFile,
) {
	const visitNode: ts.Visitor = node =>
		ts.visitEachChild(
			transformNode(state, node),
			child => visitNode(child),
			state.context,
		);

	return ts.visitEachChild(sourceFile, visitNode, state.context);
}

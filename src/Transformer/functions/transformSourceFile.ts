import ts from "byots";
import { DiagnosticError, Diagnostics } from "../../Shared/diagnostics";
import { TransformState } from "../state";
import { transformNode } from "./transformNode";

export function transformOr<T extends ts.Node>(original: T, setter: () => T) {
	let currentNode: T;
	try {
		currentNode = setter();
	} catch (e) {
		if (typeof e === "object" && e != null) {
			if (!("diagnostic" in e)) {
				throw e;
			}
		}
	}
	currentNode ??= original;
	return currentNode;
}

export function transformSourceFile(
	state: TransformState,
	sourceFile: ts.SourceFile,
) {
	const visitNode: ts.Visitor = node =>
		ts.visitEachChild(
			transformOr(node, () => transformNode(state, node)),
			child => visitNode(child),
			state.context,
		);

	/* Flushing out of the diagnostics */
	for (const diag of Diagnostics.flush()) {
		state.addDiagonstic(diag);
	}

	return ts.visitEachChild(sourceFile, visitNode, state.context);
}

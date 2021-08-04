import ts from "typescript";
import { transformPathFunction } from "../macros/transformPathFunction";
import { TransformState } from "../state";
import { Diagnostics } from "../../Shared/diagnostics";
import { transformFileNameFunction } from "../macros/transformFileNameFunction";

function transformCallExpressionInner(
	state: TransformState,
	node: ts.CallExpression,
	functionName: string,
) {
	switch (functionName) {
		case "$path":
			return transformPathFunction(state, node);
		case "$pathWaitFor":
			return transformPathFunction(state, node, true);
		case "$fileName":
			return transformFileNameFunction(state, node);
		case "$root":
			return;
		default:
			Diagnostics.error(
				node,
				`${functionName} is an unsupported marco call name!`,
			);
	}
}

export function transformCallExpression(
	state: TransformState,
	node: ts.CallExpression,
) {
	const signature = state.typeChecker.getResolvedSignature(node);
	if (!signature) {
		return node;
	}

	const { declaration } = signature;
	if (
		!declaration ||
		ts.isJSDocSignature(declaration) ||
		!state.isTransformerModule(declaration.getSourceFile())
	) {
		return node;
	}

	const functionName = declaration.name && declaration.name.getText();
	if (!functionName) {
		return node;
	}

	return transformCallExpressionInner(state, node, functionName);
}

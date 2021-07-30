import ts from "byots";
import { transformPathFunction } from "../macros/transformPathFunction";
import { TransformState } from "../state";
import { Diagnostics } from "../../Shared/diagnostics";

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

import ts from "byots";
import { ErrorLogger } from "../../Shared/constants";
import { transformPathFunction } from "../macros/transformPathFunction";
import { TransformState } from "../state";

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
			ErrorLogger.writeLine("Unsupported call marco name!");
			process.exit(1);
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

import ts from "byots";
import Macro from "../../Macro";
import { ErrorLogger } from "../../Shared/constants";
import { transformPathFunction } from "../macros/transformPathFunction";
import { TransformState } from "../state";

function transformCallExpressionInner(
	state: TransformState,
	node: ts.CallExpression,
	functionName: string,
) {
	switch (functionName) {
		case Macro.CALL_MACROS.$path:
			return transformPathFunction(state, node);
		default:
			ErrorLogger.writeLine("Unsupported call marco name!");
			process.exit(1);
	}
}

export function transformCallExpression(
	state: TransformState,
	node: ts.CallExpression,
) {
	/* Get the symbol */
	const symbol = state.getSymbol(node);
	if (!symbol) {
		return node;
	}

	const macrosName = state.macroManager.getCallMacros(symbol);
	if (!macrosName) {
		return node;
	}

	return transformCallExpressionInner(state, node, macrosName);
}

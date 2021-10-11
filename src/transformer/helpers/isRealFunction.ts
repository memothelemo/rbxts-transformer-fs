import ts from "typescript";
import { TransformContext } from "../context";

export function isRealFunction(
	context: TransformContext,
	node: ts.Node | undefined,
): node is ts.FunctionExpression {
	if (!node) return false;

	// function-like expressions
	if (ts.isFunctionLike(node)) {
		return true;
	}

	// identifier symbol check
	const symbol = context.getSymbol(node);
	if (symbol) {
		return ts.isFunctionSymbol(symbol) ?? false;
	}

	return false;
}

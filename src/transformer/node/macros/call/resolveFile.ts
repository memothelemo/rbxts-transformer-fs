import fs from "fs";
import ts from "typescript";
import { CallMacroFunction } from ".";
import { TransformerDiagnostics } from "../../../../shared/diagnostics/diagnostics";
import { DiagnosticError } from "../../../../shared/errors/diagnostic";
import { extractStringFromAnyNode } from "../../../helpers/extractStringFromAnyNode";
import { getAbsolutePath } from "../../../helpers/getAbsolutePath";
import { isRealFunction } from "../../../helpers/isRealFunction";

function shouldWrap(node: ts.Node) {
	if (ts.isFunctionLike(node)) {
		return true;
	}
	return false;
}

export const transformResolveFileMacro: CallMacroFunction = (context, node) => {
	// becasuse we're focusing on the real file path
	// we don't need roblox path actually to do that
	// extract string from any node (if possible)
	const pathArg = node.arguments[0];

	if (!ts.isStringLiteralLike(pathArg) && !ts.isIdentifier(pathArg)) {
		throw new DiagnosticError(
			TransformerDiagnostics.GET_FILE_MACRO.NOT_STRING(node),
		);
	}

	const pathArgText = extractStringFromAnyNode(context, pathArg);
	if (!pathArgText) {
		throw new DiagnosticError(
			TransformerDiagnostics.GET_FILE_MACRO.NOT_STRING(node),
		);
	}

	// require two functions obviously
	const resolvedCallback = node.arguments[1];
	const notResolvedCallback = node.arguments[2];

	if (!isRealFunction(context, resolvedCallback)) {
		throw new DiagnosticError(
			TransformerDiagnostics.RESOLVE_MACRO.INVALID_PATH_ARG(1)(
				resolvedCallback,
			),
		);
	}

	if (!isRealFunction(context, notResolvedCallback)) {
		throw new DiagnosticError(
			TransformerDiagnostics.RESOLVE_MACRO.INVALID_PATH_ARG(2)(
				notResolvedCallback,
			),
		);
	}

	// get the best absolute path
	const absPath = getAbsolutePath(
		context,
		context.getSourceFile(node),
		pathArgText,
	);

	let resultExp: ts.Expression;

	// if that file does not exists, then the result should be resolved callback
	if (fs.existsSync(absPath)) {
		resultExp = resolvedCallback;
	} else {
		resultExp = notResolvedCallback;
	}

	if (shouldWrap(node)) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		resultExp = ts.factory.createParenthesizedExpression(resultExp);
	}

	// create new call expression
	return ts.factory.updateCallExpression(node, resultExp, undefined, []);
};

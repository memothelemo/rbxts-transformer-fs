import fs from "fs";
import ts from "typescript";
import { CallMacroFunction } from ".";
import { TransformerDiagnostics } from "../../../../shared/diagnostics/diagnostics";
import { DiagnosticError } from "../../../../shared/errors/diagnostic";
import { extractStringFromAnyNode } from "../../../helpers/extractStringFromAnyNode";
import { getAbsolutePath } from "../../../helpers/getAbsolutePath";

export const transformRequireFileMacro: CallMacroFunction = (context, node) => {
	// becasuse we're focusing on the real file path
	// we don't need roblox path actually to do that
	// extract string from any node (if possible)
	const pathArg = node.arguments[0];

	// TODO: make it simpler by making a shared function
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

	// get the best absolute path
	const absPath = getAbsolutePath(
		context,
		context.getSourceFile(node),
		pathArgText,
	);

	// if that file does not exists, error!
	if (!fs.existsSync(absPath)) {
		throw new DiagnosticError(
			TransformerDiagnostics.REQUIRE_FILE.NOT_FOUND(absPath)(node),
		);
	}

	// making sure that file is a real file
	if (!fs.statSync(absPath).isFile()) {
		throw new DiagnosticError(
			TransformerDiagnostics.REQUIRE_FILE.NOT_FOUND(absPath)(node),
		);
	}

	return undefined;
};

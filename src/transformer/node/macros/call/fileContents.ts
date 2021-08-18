import fs from "fs-extra";
import { CallMacroFunction } from ".";
import { TransformerDiagnostics } from "../../../../shared/diagnostics/diagnostics";
import { DiagnosticError } from "../../../../shared/errors/diagnostic";
import { printIfVerbose } from "../../../../shared/functions/print";
import { parseFileGetterCallExpression } from "../../../helpers/parseFileGetterCallExpression";

export const transformFileContentsCallMacro: CallMacroFunction = (
	context,
	node,
) => {
	// get the file path
	const filePath = parseFileGetterCallExpression(context, node, false);

	if (Array.isArray(filePath)) {
		throw new DiagnosticError(
			TransformerDiagnostics.UNEXPECTED_ERROR(node),
		);
	}

	printIfVerbose("Reading file contents");

	// load that file
	const fileContents = fs.readFileSync(filePath).toString();

	return context.tsContext.factory.createStringLiteral(fileContents);
};

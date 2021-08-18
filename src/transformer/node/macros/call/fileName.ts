import path from "path";
import { factory } from "typescript";
import { TransformerDiagnostics } from "../../../../shared/diagnostics/diagnostics";
import { DiagnosticError } from "../../../../shared/errors/diagnostic";
import { printIfVerbose } from "../../../../shared/functions/print";
import { CallMacroFunction } from ".";

export const transformFileNameCallMacro: CallMacroFunction = (
	context,
	node,
) => {
	// verifying rojo project
	if (!context.rojoProject) {
		throw new DiagnosticError(
			TransformerDiagnostics.USED_BUT_UNRESOLVED_ROJO(node, "$fileName"),
		);
	}

	printIfVerbose("Transforming from $fileName to source file's name");

	// get the node's source file
	const sourceFile = context.getSourceFile(node);

	// make the sourceFile's path relative
	// we don't know where someone stored it
	const relativePath = path.relative(context.srcDir, sourceFile.fileName);

	// piece of cake!
	return factory.createStringLiteral(relativePath);
};

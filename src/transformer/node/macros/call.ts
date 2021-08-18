import path from "path";
import ts, { factory } from "typescript";
import { TransformerSafeErrors } from "../../../shared/diagnostics/diagnostics";
import { DiagnosticError } from "../../../shared/errors/diagnostic";
import { printIfVerbose } from "../../../shared/functions/print";
import { TransformContext } from "../../context";

type CallMacroFunction = (
	context: TransformContext,
	node: ts.CallExpression,
) => ts.Node | ts.Node[];

export const CALL_MACROS: { [index: string]: CallMacroFunction } = {
	$fileName: (context, node) => {
		// verifying rojo project
		if (!context.rojoProject) {
			throw new DiagnosticError(
				TransformerSafeErrors.UNRESOLVED_ROJO(node, "$fileName"),
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
	},
};

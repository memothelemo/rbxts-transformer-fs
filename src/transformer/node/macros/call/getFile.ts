import ts from "typescript";
import { CallMacroFunction } from ".";
import { TransformerDiagnostics } from "../../../../shared/diagnostics/diagnostics";
import { DiagnosticError } from "../../../../shared/errors/diagnostic";
import { TransformContext } from "../../../context";

// because we have waitfor implemented
// so we need to seperate those out

/**
 * Modular function that allows to transform $getFile
 * universally
 * @param waitFor Implement waitFor
 */
function transformGetFileCallMacroInner(
	context: TransformContext,
	node: ts.CallExpression,
	waitFor: boolean,
) {
	const sourceFile = context.getSourceFile(node);
	context.addRequiredFunction(sourceFile, "___getInstanceFromPath");

	if (!context.rojoProject) {
		throw new DiagnosticError(
			TransformerDiagnostics.USED_BUT_UNRESOLVED_ROJO(
				node,
				waitFor ? "$getFileWaitFor" : "$getFile",
			),
		);
	}

	let typeArgument: ts.TypeNode | undefined;
	if (node.typeArguments) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		typeArgument = node.typeArguments[0];
	}

	return node;
}

export const transformGetFileCallMacro: CallMacroFunction = (context, node) =>
	transformGetFileCallMacroInner(context, node, false);

export const transformGetFileWaitForCallMacro: CallMacroFunction = (
	context,
	node,
) => transformGetFileCallMacroInner(context, node, true);

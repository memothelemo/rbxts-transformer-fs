import ts from "typescript";
import { TransformerDiagnostics } from "../../../shared/diagnostics/diagnostics";
import { DiagnosticError } from "../../../shared/errors/diagnostic";
import { printIfVerbose } from "../../../shared/functions/print";
import { TransformContext } from "../../context";
import { isSignatureFromTransformer } from "../../helpers/isSignatureFromTransformer";
import { CALL_MACROS } from "../macros/call";

export function transformCallExpression(
	context: TransformContext,
	node: ts.CallExpression,
) {
	const signature = context.typeChecker.getResolvedSignature(node);
	if (!signature) {
		return node;
	}

	const caseVariable = isSignatureFromTransformer(context, signature);
	const isFromTransformer = caseVariable[0];

	if (!isFromTransformer) {
		return node;
	}

	const declaration = caseVariable[1]!;
	const functionName = declaration.name && declaration.name.getText();

	if (!functionName) {
		return node;
	}

	// call macros begins
	const macro = CALL_MACROS[functionName];
	if (!macro) {
		throw new DiagnosticError(
			TransformerDiagnostics.MACROS.UNSUPPORTED_CALL(node, functionName),
		);
	}

	printIfVerbose(`Call macro found: ${functionName}`);

	return macro(context, node);
}

import ts from "typescript";
import { TransformerDiagnostics } from "../../shared/diagnostics/diagnostics";
import { DiagnosticError } from "../../shared/errors/diagnostic";
import { TransformContext } from "../context";

export function extractStringFromAnyNode(
	context: TransformContext,
	node: ts.StringLiteralLike | ts.Identifier,
) {
	if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
		const text = node.getText();
		return ts.stripQuotes(text);
	}

	const type = context.getType(node);
	if (!type) {
		throw new DiagnosticError(TransformerDiagnostics.UNKNOWN_TYPE(node));
	}

	if (type.flags !== ts.TypeFlags.StringLiteral) {
		return undefined;
	}

	return (type as ts.StringLiteralType).value;
}

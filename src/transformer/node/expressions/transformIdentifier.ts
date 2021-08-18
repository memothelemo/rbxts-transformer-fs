import ts from "typescript";
import { TransformerDiagnostics } from "../../../shared/diagnostics/diagnostics";
import { DiagnosticError } from "../../../shared/errors/diagnostic";
import { TransformContext } from "../../context";
import { ID_MACROS } from "../macros/identifier";

export function transformIdentifier(
	context: TransformContext,
	node: ts.Identifier,
) {
	// if it is import clause then do not transform
	if (ts.isImportClause(node.parent)) {
		return node;
	}

	const symbol = context.getSymbol(node);
	if (!symbol) {
		return node;
	}

	const { valueDeclaration } = symbol;
	if (!valueDeclaration) {
		return node;
	}

	if (!context.isTransformerModule(valueDeclaration.getSourceFile())) {
		return node;
	}

	// identifier macro begins
	const identifierName = node.getText();
	const macro = ID_MACROS[identifierName];

	if (!macro) {
		throw new DiagnosticError(
			TransformerDiagnostics.MACROS.UNSUPPORTED_IDENTIFIER(
				node,
				identifierName,
			),
		);
	}

	return macro(context, node);
}

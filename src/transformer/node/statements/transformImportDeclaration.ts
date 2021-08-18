import ts, { factory } from "typescript";
import { print, printIfVerbose } from "../../../shared/functions/print";
import { LogManager } from "../../../shared/LogManager";
import { TransformContext } from "../../context";

function isModuleImport(context: TransformContext, node: ts.ImportDeclaration) {
	if (!node.importClause) {
		return false;
	}

	const namedBindings = node.importClause.namedBindings;
	if (!node.importClause.name && !namedBindings) {
		return false;
	}

	const importSymbol = context.typeChecker.getSymbolAtLocation(
		node.moduleSpecifier,
	);

	if (
		!importSymbol ||
		!importSymbol.valueDeclaration ||
		!context.isTransformerModule(
			importSymbol.valueDeclaration.getSourceFile(),
		)
	) {
		return false;
	}

	return true;
}

export function transformImportDeclaration(
	context: TransformContext,
	node: ts.ImportDeclaration,
) {
	if (isModuleImport(context, node)) {
		printIfVerbose(`Removing transformer module import statement`);

		const { importClause } = node;
		if (importClause !== undefined && importClause.isTypeOnly) {
			return node;
		}

		if (importClause !== undefined) {
			return factory.updateImportDeclaration(
				node,
				undefined,
				undefined,
				factory.updateImportClause(
					importClause,
					true,
					importClause.name,
					importClause.namedBindings,
				),
				node.moduleSpecifier,
			);
		}

		return undefined;
	}
	return node;
}

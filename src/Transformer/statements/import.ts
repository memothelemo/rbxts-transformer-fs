import ts, { factory } from "byots";
import { generateGetInstanceFromPath } from "../functions/generateGetInstanceFromPath";
import { TransformState } from "../state";

function isModuleImport(state: TransformState, node: ts.ImportDeclaration) {
	if (!node.importClause) {
		return false;
	}

	const namedBindings = node.importClause.namedBindings;
	if (!node.importClause.name && !namedBindings) {
		return false;
	}

	const importSymbol = state.typeChecker.getSymbolAtLocation(
		node.moduleSpecifier,
	);

	if (
		!importSymbol ||
		!importSymbol.valueDeclaration ||
		!state.isTransformerModule(
			importSymbol.valueDeclaration.getSourceFile(),
		)
	) {
		return false;
	}

	return true;
}

export function transformImportDeclaration(
	state: TransformState,
	node: ts.ImportDeclaration,
) {
	if (isModuleImport(state, node)) {
		const { importClause } = node;
		const finalReturn: ts.Node[] = [];

		if (importClause !== undefined && importClause.isTypeOnly) {
			finalReturn.push(node);
		}

		if (importClause !== undefined) {
			finalReturn.push(
				factory.updateImportDeclaration(
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
				),
			);
		}

		/* If nothing's there then add this automatically */
		if (finalReturn.length === 0) {
			finalReturn.push(
				factory.createExportDeclaration(
					undefined,
					undefined,
					false,
					ts.factory.createNamedExports([]),
					undefined,
				),
			);
		}

		finalReturn.push(
			generateGetInstanceFromPath(state, state.getSourceFile(node)),
		);
		return finalReturn;
	}
	return node;
}

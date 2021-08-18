import ts, { factory } from "typescript";
import Rojo from "../../rojo";
import { TransformerDiagnostics } from "../../shared/diagnostics/diagnostics";
import { DiagnosticError } from "../../shared/errors/diagnostic";
import { TransformContext } from "../context";
import { propertyAccessExpressionChain } from "./propertyAccessExpressionChain";

export function getProjectRoot(context: TransformContext, node: ts.Node) {
	let root: ts.Identifier | ts.PropertyAccessExpression;
	let stringedRoot: string;

	const sourceFile = ts.isSourceFile(node)
		? node
		: context.getSourceFile(node);

	if (context.isGame === true) {
		root = factory.createIdentifier("game");
		stringedRoot = "game";
	} else {
		// eslint-disable-next-line prettier/prettier
		const sourceOutPath = context
			.pathTranslator
			.getOutputPath(sourceFile.fileName);

		// eslint-disable-next-line prettier/prettier
		const rbxPath = context
			.rojoProject!
			.getRbxPathFromFilePath(sourceOutPath);

		// verifying rbxPath
		if (!rbxPath) {
			throw new DiagnosticError(
				TransformerDiagnostics.SOURCE_FILE_NOT_IN_ROJO_CONFIG(
					sourceFile,
				),
			);
		}

		const names = Rojo.Utils.relativeRootInScript(rbxPath).map(v =>
			v === Rojo.RbxPathParent ? "Parent!" : v,
		);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		root = propertyAccessExpressionChain(context, names);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		stringedRoot = names.join(".");
	}

	return [root, stringedRoot] as const;
}

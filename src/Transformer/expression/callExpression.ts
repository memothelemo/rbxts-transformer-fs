import ts, { factory } from "byots";
import path from "path";
import { ErrorLogger } from "../../Shared/constants";
import { assert } from "../../Shared/functions/assert";
import { isTransformerModule } from "../functions/isTransformerModule";
import { TransformState } from "../state";

function getPathFromSpecifier(
	state: TransformState,
	source: ts.SourceFile,
	hostDir: string,
	specifier: string,
) {
	const sourceDir = path.dirname(source.fileName);
	const absolutePath = specifier.startsWith(".")
		? path.join(sourceDir, specifier)
		: path.join(hostDir, specifier);
	const outputPath = state.pathTranslator.getOutputPath(absolutePath);

	return state.rojoResolver?.getRbxPathFromFilePath(outputPath);
}

function transformPathFunction(state: TransformState, node: ts.CallExpression) {
	if (!state.rojoResolver) {
		throw new Error("$path was used but Rojo could not be resolved");
	}

	let typeArgument: ts.TypeNode | undefined;
	if (node.typeArguments) {
		node.typeArguments.forEach((v, i) => {
			if (i === 0) {
				typeArgument = v;
			}
		});
	}

	const converted = new Array<ts.Expression>();
	for (const arg of node.arguments) {
		if (arg === undefined || !ts.isStringLiteral(arg)) {
			throw new Error("Expected string");
		}

		const rbxPath = getPathFromSpecifier(
			state,
			state.getSourceFile(node),
			state.currentDir,
			arg.text,
		);

		assert(rbxPath, "Could not find rojo data");
		converted.push(
			factory.createArrayLiteralExpression(
				rbxPath.map(v => factory.createStringLiteral(v)),
			),
		);
	}

	return factory.createCallExpression(
		factory.createIdentifier("___getInstanceFromPath"),
		typeArgument ? [typeArgument] : undefined,
		converted,
	);
}

function transformCallExpressionInner(
	state: TransformState,
	node: ts.CallExpression,
	functionName: string,
) {
	switch (functionName) {
		case "$path":
			return transformPathFunction(state, node);
		default:
			ErrorLogger.writeLine("Unsupported call marco name!");
			process.exit(1);
	}
}

export function transformCallExpression(
	state: TransformState,
	node: ts.CallExpression,
) {
	const signature = state.typeChecker.getResolvedSignature(node);
	if (!signature) {
		return node;
	}

	const { declaration } = signature;
	if (
		!declaration ||
		ts.isJSDocSignature(declaration) ||
		!isTransformerModule(declaration.getSourceFile())
	) {
		return node;
	}

	const functionName = declaration.name && declaration.name.getText();
	if (!functionName) {
		return node;
	}

	return transformCallExpressionInner(state, node, functionName);
}

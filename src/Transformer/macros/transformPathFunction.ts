import ts, { factory } from "byots";
import path from "path";
import { Diagnostics } from "../../Shared/diagnostics";
import { assert } from "../../Shared/functions/assert";
import { getStringLiteralType } from "../functions/getIdentifierType";
import { TransformState } from "../state";

export function getPathFromSpecifier(
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

export function transformPathFunction(
	state: TransformState,
	node: ts.CallExpression,
	waitFor?: boolean,
) {
	if (!state.rojoResolver) {
		Diagnostics.error(
			node,
			"$path was used but Rojo could not be resolved",
		);
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
	const pathArg = node.arguments[0];
	let pathArgText: string;

	// instead of display an error if it is not a string literal
	// we can get the type of it (only for identifiers)
	if (!ts.isStringLiteral(pathArg)) {
		if (ts.isIdentifier(pathArg)) {
			const contents = getStringLiteralType(state, pathArg);
			pathArgText = contents.value;
		} else {
			Diagnostics.error(
				node,
				"Path argument must be a string or complete string type, seriously",
			);
		}
	} else {
		pathArgText = pathArg.text;
	}

	const rbxPath = getPathFromSpecifier(
		state,
		state.getSourceFile(node),
		state.currentDir,
		pathArgText,
	);

	if (!rbxPath) {
		Diagnostics.error(node, "Could not find rojo data");
	}

	converted.push(
		factory.createArrayLiteralExpression(
			rbxPath.map(v => factory.createStringLiteral(v)),
		),
	);

	if (waitFor) {
		converted.push(factory.createTrue());
		if (node.arguments[1]) {
			converted.push(node.arguments[1]);
		}
	}

	/* Get the second argument (timeout) if possible */
	return factory.createCallExpression(
		factory.createIdentifier("___getInstanceFromPath"),
		typeArgument ? [typeArgument] : [],
		converted,
	);
}

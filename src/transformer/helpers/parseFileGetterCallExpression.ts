import fs from "fs-extra";
import path from "path";
import ts from "typescript";
import { TransformerDiagnostics } from "../../shared/diagnostics/diagnostics";
import { DiagnosticError } from "../../shared/errors/diagnostic";
import { printIfVerbose } from "../../shared/functions/print";
import { PKG_JSON } from "../../shared/util/package";
import { TransformContext } from "../context";
import { TransformerError } from "../error";
import { extractStringFromAnyNode } from "./extractStringFromAnyNode";

function getAbsolutePath(
	context: TransformContext,
	sourceFile: ts.SourceFile,
	specifier: string,
) {
	const sourceDir = path.dirname(sourceFile.fileName);
	const absolutePath = specifier.startsWith(".")
		? path.join(sourceDir, specifier)
		: path.join(context.projectDir, specifier);

	return absolutePath;
}

function getPathFromSpecifier(
	context: TransformContext,
	absolutePath: string,
	fromRojo = true,
	requireOutput = false,
) {
	let finalPath = absolutePath;
	if (requireOutput) {
		finalPath = context.pathTranslator.getOutputPath(absolutePath);
	}

	if (fromRojo) {
		return context.rojoProject!.getRbxPathFromFilePath(finalPath);
	}

	return finalPath;
}

export function parseFileGetterCallExpression(
	context: TransformContext,
	node: ts.CallExpression,
	fromRojo = true,
	requireOutput = false,
) {
	printIfVerbose(`Parsing file getter call expression`);

	// extract string from any node (if possible)
	const pathArg = node.arguments[0];

	if (!ts.isStringLiteralLike(pathArg) && !ts.isIdentifier(pathArg)) {
		throw new DiagnosticError(
			TransformerDiagnostics.GET_FILE_MACRO.NOT_STRING(node),
		);
	}

	const pathArgText = extractStringFromAnyNode(context, pathArg);
	if (!pathArgText) {
		throw new DiagnosticError(
			TransformerDiagnostics.GET_FILE_MACRO.NOT_STRING(node),
		);
	}

	// get absolute path
	const sourceFile = context.getSourceFile(node);
	const absPath = getAbsolutePath(context, sourceFile, pathArgText);

	const outputPath = getPathFromSpecifier(
		context,
		absPath,
		fromRojo,
		requireOutput,
	);

	if (!Array.isArray(outputPath) && outputPath === undefined && fromRojo) {
		throw new DiagnosticError(
			TransformerDiagnostics.COULD_NOT_FIND_ROJO_DATA(node, absPath),
		);
	} else {
		if (Array.isArray(outputPath) && !fromRojo) {
			// I do not sure if it happens to anybody so I make it an error
			// that they need to go to my github repo to report this
			throw new TransformerError(
				`Please make an issue in Github: ${PKG_JSON.bugs.url}\n[INFO]:\nArgument: ${pathArgText}\nResult: ${outputPath}\nFrom rojo: ${fromRojo}\nRequires output: ${requireOutput}`,
			);
		}
		if (
			typeof outputPath === "string" &&
			!fs.existsSync(outputPath as string)
		) {
			throw new DiagnosticError(
				TransformerDiagnostics.GET_FILE_MACRO.INVALID_PATH(
					node,
					absPath,
				),
			);
		}
	}

	return outputPath!;
}

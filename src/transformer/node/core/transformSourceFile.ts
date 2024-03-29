import path from "path";
import ts from "typescript";
import { TERMINATING_COMPILER_PROCESS_TXT } from "../../../shared/errors/constants";
import { DiagnosticError } from "../../../shared/errors/diagnostic";
import { print, printIfVerbose } from "../../../shared/functions/print";
import { TransformContext } from "../../context";
import { TransformerError } from "../../error";
import { addCommentFromNode } from "../../helpers/addCommentFromNode";
import { REQUIRED_FUNCTIONS } from "../../helpers/requiredFunctions";
import { transformNode } from "./transformNode";

function transformNodeOr<T>(
	context: TransformContext,
	originalNode: ts.Node,
	callback: () => T,
) {
	try {
		return callback();
	} catch (e) {
		if (e instanceof TransformerError) {
			e.print();
			print(TERMINATING_COMPILER_PROCESS_TXT);
			process.exit(1);
		} else if (e instanceof DiagnosticError) {
			context.addDiagnostic(e.diagnostic);
			return originalNode;
		} else if (e instanceof Error) {
			print(
				`Unexpected error! [${e.name}]: ${e.message}\n\nStack traceback:${e.stack}`,
			);
		} else {
			print(`Unexpected error! ${e}`);
			process.exit(1);
		}
	}
}

export function transformSourceFile(
	context: TransformContext,
	sourceFile: ts.SourceFile,
) {
	printIfVerbose(
		`Transforming ${path.relative(context.srcDir, sourceFile.fileName)}`,
	);

	const visitNode: ts.Visitor = node =>
		ts.visitEachChild(
			transformNodeOr(context, node, () =>
				transformNode(context, node),
			) as ts.Node,
			child => visitNode(child),
			context.tsContext,
		);

	const transformed = ts.visitEachChild(
		sourceFile,
		visitNode,
		context.tsContext,
	);

	// provide them with required functions
	if (context.isSourceFileNeedsUnshift(sourceFile)) {
		const generatedStatements = new Array<ts.Statement>();
		const requiredFunctions = context.getRequiredFunctions(sourceFile)!;
		for (const functionName of requiredFunctions) {
			const maker = REQUIRED_FUNCTIONS[functionName];
			if (maker !== undefined) {
				// construct a comment if possible
				const makerResult = maker(context, sourceFile);
				const startingNode = makerResult[0];
				if (startingNode !== undefined) {
					addCommentFromNode(
						startingNode,
						`▼ rbxts-transformer-fs required function ▼ --`,
					);
				}
				generatedStatements.push(...makerResult);
			}
		}

		return context.tsContext.factory.updateSourceFile(transformed, [
			...generatedStatements,
			...transformed.statements,
		]);
	}

	return transformed;
}

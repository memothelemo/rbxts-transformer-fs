import ts from "typescript";
import { TERMINATING_COMPILER_PROCESS_TXT } from "../../../shared/errors/constants";
import { DiagnosticError } from "../../../shared/errors/diagnostic";
import { print } from "../../../shared/functions/print";
import { TransformContext } from "../../context";
import { TransformerError } from "../../error";
import { transformNode } from "./transformNode";

function transformNodeOr<T>(context: TransformContext, originalNode: ts.Node, callback: () => T) {
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
		} else {
			print(`Unexpected error! ${e}`);
			process.exit(1);
		}
	}
}

export function transformSourceFile(context: TransformContext, sourceFile: ts.SourceFile) {
	const visitNode: ts.Visitor = node =>
		ts.visitEachChild(
			transformNodeOr(context, node, () => transformNode(context, node)) as ts.Node,
			child => visitNode(child),
			context.tsContext,
		);

	const transformed = ts.visitEachChild(sourceFile, visitNode, context.tsContext);
	if (context.isSourceFileNeedsUnshift(sourceFile)) {
		const requiredFunctions = context.getRequiredFunctions(sourceFile);
		// TODO: make functions
	}

	return transformed;
}

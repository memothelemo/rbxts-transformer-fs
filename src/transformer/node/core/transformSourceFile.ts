import ts from "typescript";
import { TransformContext } from "../../context";
import { transformNode } from "./transformNode";

export function transformSourceFile(context: TransformContext, sourceFile: ts.SourceFile) {
	const visitNode: ts.Visitor = node =>
		ts.visitEachChild(transformNode(context, node) as ts.Node, child => visitNode(child), context.tsContext);

	const transformed = ts.visitEachChild(sourceFile, visitNode, context.tsContext);
	if (context.isSourceFileNeedsUnshift(sourceFile)) {
		const requiredFunctions = context.getRequiredFunctions(sourceFile);
		// TODO: make functions
	}

	return transformed;
}

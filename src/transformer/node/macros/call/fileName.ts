import path from "path";
import { factory } from "typescript";
import { CallMacroFunction } from ".";
import { printIfVerbose } from "../../../../shared/functions/print";

export const transformFileNameCallMacro: CallMacroFunction = (
	context,
	node,
) => {
	printIfVerbose("Transforming from $fileName to source file's name");

	// get the node's source file
	const sourceFile = context.getSourceFile(node);

	// make the source file's path relative
	// we don't know where someone stored it
	const relativePath = path.relative(context.srcDir, sourceFile.fileName);

	// piece of cake!
	return factory.createStringLiteral(relativePath);
};

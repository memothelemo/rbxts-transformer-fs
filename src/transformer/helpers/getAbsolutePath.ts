import path from "path";
import ts from "typescript";
import { TransformContext } from "../context";

export function getAbsolutePath(
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

import type ts from "typescript";
import {} from "ts-expose-internals";
import { TransformContext } from "./transformer/context";
import Rojo from "./rojo";

Rojo.FILE_REGEX;

export default function (program: ts.Program) {
	return (tsContext: ts.TransformationContext) => {
		// required variables for TransformContext
		const context = new TransformContext(
			program.getCurrentDirectory(),
			program.getCompilerOptions(),
			program.getTypeChecker(),
			tsContext,
		);
		return (file: ts.SourceFile) => file;
	};
}

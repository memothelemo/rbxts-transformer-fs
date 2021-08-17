import type ts from "typescript";
import {} from "ts-expose-internals";
import { TransformContext } from "./transformer/context";
import { BaseError } from "./shared/errors/base";

export default function (program: ts.Program) {
	return (tsContext: ts.TransformationContext) => {
		// required variables for TransformContext
		try {
			const context = new TransformContext(
				program.getCurrentDirectory(),
				program.getCompilerOptions(),
				program.getTypeChecker(),
				tsContext,
			);
			return (file: ts.SourceFile) => file;
		} catch (e) {
			if (e instanceof BaseError) {
				e.print();
			} else {
				console.log(e);
			}
			process.exit(1);
		}
	};
}

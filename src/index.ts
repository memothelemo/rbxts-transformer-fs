import ts from "typescript";
import {} from "ts-expose-internals";
import { TransformContext } from "./transformer/context";
import { transformSourceFile } from "./transformer/node/core/transformSourceFile";
import { TransformerError } from "./transformer/error";
import { OUTDATED_RBXTSC_TXT } from "./shared/errors/constants";
import { catchError } from "./shared/util/catchError";

export default function (program: ts.Program) {
	return (tsContext: ts.TransformationContext) => {
		// required variables for TransformContext
		/*
		  - because roblox-ts reloads this transformer
		  - when files are changed during watch mode

		  - we can take advantage by keeping track if
		  - a source file requires making ___getInstanceFromPath function
		*/
		const context = catchError(
			() =>
				new TransformContext(
					program.getCompilerOptions(),
					program.getTypeChecker(),
					tsContext,
				),
		);
		return (file: ts.SourceFile) => {
			// just in case if someone uses outdated version of roblox-ts (before 1.2.0?)
			// or invalid version of TypeScript
			// before the transformer problem has been fixed
			if (!ts.isSourceFile(file)) {
				const error = new TransformerError(OUTDATED_RBXTSC_TXT);
				error.print();

				process.exit(1);
			}
			if (context.hasErrors) {
				return file;
			}
			return transformSourceFile(context, file);
		};
	};
}

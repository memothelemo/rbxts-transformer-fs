import ts from "typescript";
import {} from "ts-expose-internals";
import { TransformContext } from "./transformer/context";
import { benchmarkReturn } from "./shared/util/benchmark";

export default function (program: ts.Program) {
	return (tsContext: ts.TransformationContext) => {
		// required variables for TransformContext
		const context = benchmarkReturn(
			`Instantiating TransformContext`,
			() =>
				new TransformContext(
					program.getCurrentDirectory(),
					program.getCompilerOptions(),
					program.getTypeChecker(),
					tsContext,
				),
		);
		return (file: ts.SourceFile) => file;
	};
}

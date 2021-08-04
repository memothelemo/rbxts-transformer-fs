import ts from "typescript";
import Transformer from "./Transformer";
import { TransformerConfig } from "./Transformer/config";
import {} from "ts-expose-internals";
import { transformSourceFile } from "./Transformer/functions/transformSourceFile";

export default function (program: ts.Program, config: TransformerConfig) {
	return (
		context: ts.TransformationContext,
	): ((file: ts.SourceFile) => ts.SourceFile) => {
		const state = new Transformer.State(program, context, config);
		state.printInVerbose("Initializing transformer state");

		return file => transformSourceFile(state, file);
	};
}

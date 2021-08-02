import ts from "typescript";
import Transformer from "./Transformer";
import { TransformerConfig } from "./Transformer/config";
import {} from "ts-expose-internals";

export default function (program: ts.Program, config: TransformerConfig) {
	return (
		context: ts.TransformationContext,
	): ((file: ts.SourceFile) => ts.SourceFile) => {
		const state = new Transformer.State(program, context, config);
		let transformed: Map<ts.SourceFile, ts.SourceFile>;
		return file => {
			if (!transformed) {
				transformed = state.transformAll();
			}
			return transformed.get(file) ?? file;
		};
	};
}

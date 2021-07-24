import ts from "byots";
import Transformer from "./Transformer";

export default function (program: ts.Program) {
	return (
		context: ts.TransformationContext,
	): ((file: ts.SourceFile) => ts.SourceFile) => {
		const state = new Transformer.State(program, context);
		let transformed: Map<ts.SourceFile, ts.SourceFile>;
		return file => {
			if (!transformed) {
				transformed = state.transformAll();
			}
			return transformed.get(file) ?? file;
		};
	};
}

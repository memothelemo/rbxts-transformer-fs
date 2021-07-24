import ts from "byots";
import { TransformState } from "./Transformer/state";

export default function (program: ts.Program) {
	return (
		context: ts.TransformationContext,
	): ((file: ts.SourceFile) => ts.SourceFile) => {
		const state = new TransformState(program, context);
		const transformed = state.transformAll();
		return file => transformed.get(file) ?? file;
	};
}

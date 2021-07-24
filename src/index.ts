import ts from "byots";
import { TransformState } from "./Transformer/state";

export default function (program: ts.Program) {
	return (
		context: ts.TransformationContext,
	): ((file: ts.SourceFile) => ts.SourceFile) => {
		// writing \n because roblox-ts verbose writing issue
		process.stdout.write("\n");

		const state = new TransformState(program, context);
		const transformed = state.transformAll();
		return file => transformed.get(file) ?? file;
	};
}

import ts from "byots";
import { assert } from "../../Shared/functions/assert";
import { TransformState } from "../state";
import { transformStatement } from "../statement";

export function transformSourceFile(
	state: TransformState,
	sourceFile: ts.SourceFile,
): ts.SourceFile {
	sourceFile = ts.visitEachChild(
		sourceFile,
		node => {
			assert(ts.isStatement(node), "Expected `Statement` node");
			return transformStatement(state, node);
		},
		state.context,
	);

	return sourceFile;
}

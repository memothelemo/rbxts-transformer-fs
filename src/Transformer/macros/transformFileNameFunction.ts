import ts, { factory } from "typescript";
import { TransformState } from "../state";

export function transformFileNameFunction(
	state: TransformState,
	node: ts.CallExpression,
) {
	const fileName = node.getSourceFile().fileName;
	const translated = fileName.substr(state.currentDir.length + 1);

	return factory.createStringLiteral(translated);
}

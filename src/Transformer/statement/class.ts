import ts from "byots";
import { TransformState } from "../state";

export function transformClassDeclaration(
	_: TransformState,
	node: ts.ClassDeclaration,
) {
	if (node.name && ts.isIdentifier(node.name)) {
		console.log(`Found ClassDeclaration, id: ${node.name.getText()}`);
	}
	return node;
}

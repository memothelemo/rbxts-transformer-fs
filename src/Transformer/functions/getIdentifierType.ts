import ts from "byots";
import { Diagnostics } from "../../Shared/diagnostics";
import { TransformState } from "../state";

export function getStringLiteralType(
	state: TransformState,
	node: ts.Node,
): ts.StringLiteralType {
	const type = state.getType(node);
	if (!type) {
		Diagnostics.error(
			node,
			"A variable has no value innit, please configure it",
		);
	}

	/* If it is not a string literal flag then error! */
	if (type.flags !== ts.TypeFlags.StringLiteral) {
		Diagnostics.error(
			node,
			`Please put a complete string, avoid concatenation! It will confuse the transformer`,
		);
	}

	return type as ts.StringLiteralType;
}

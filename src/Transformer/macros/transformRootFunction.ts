import ts, { factory } from "typescript";
import { Diagnostics } from "../../Shared/diagnostics";
import { makeProjectRootNode } from "../functions/makeProjectRootNode";
import { TransformState } from "../state";

export function transformRootFunction(
	state: TransformState,
	node: ts.CallExpression,
) {
	const root = makeProjectRootNode(state, node);
	const typeArgs = node.typeArguments;

	if (!typeArgs) {
		Diagnostics.error(
			node,
			"This function requires type reference, example: $root<Instance>()",
		);
	}

	const typeArg = typeArgs[0];

	// Simplest way to do it
	return factory.createParenthesizedExpression(
		factory.createAsExpression(
			factory.createAsExpression(
				root.node,
				factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
			),
			typeArg,
		),
	);
}

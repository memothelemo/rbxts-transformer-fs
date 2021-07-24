import ts, { factory } from "byots";
import { TransformState } from "../state";

export function propertyAccessExpressionChain(
	state: TransformState,
	names: string[],
	index = names.length - 1,
	node?: ts.PropertyAccessExpression,
): ts.PropertyAccessExpression | ts.Identifier {
	if (index === 0) {
		return factory.createIdentifier(names[index]);
	}
	return factory.createPropertyAccessExpression(
		propertyAccessExpressionChain(state, names, index - 1, node),
		factory.createIdentifier(names[index]),
	);
}

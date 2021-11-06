import path from "path";
import ts, { factory } from "typescript";
import { CallMacroFunction } from ".";
import { TransformerDiagnostics } from "../../../../shared/diagnostics/diagnostics";
import { DiagnosticError } from "../../../../shared/errors/diagnostic";
import { TransformContext } from "../../../context";
import { parseFileGetterCallExpression } from "../../../helpers/parseFileGetterCallExpression";
import { REQUIRED_FUNCTIONS_BY_NAME } from "../../../helpers/requiredFunctions";

// because we have waitfor implemented
// so we need to seperate those out

/**
 * Modular function that allows to transform $rbxInstance
 * universally
 * @param waitFor Implement waitFor
 */
function transformInstanceCallMacroInner(
	context: TransformContext,
	node: ts.CallExpression,
	waitFor: boolean,
) {
	const sourceFile = context.getSourceFile(node);

	context.addRequiredFunction(
		sourceFile,
		REQUIRED_FUNCTIONS_BY_NAME.getInstanceFromPath,
	);

	const rbxPath = parseFileGetterCallExpression(context, node, true, true);
	if (typeof rbxPath === "string") {
		throw new DiagnosticError(
			TransformerDiagnostics.UNEXPECTED_ERROR(node),
		);
	}

	// this is going a temporary patch for now
	try {
		const tailIndex = rbxPath.length - 1;
		rbxPath[tailIndex] = path.basename(rbxPath[tailIndex] as string);
	} catch {}

	const typeArgument = node.typeArguments?.[0];
	const args = new Array<ts.Expression>(
		factory.createArrayLiteralExpression(
			rbxPath.map(v => factory.createStringLiteral(v as string)),
		),
	);

	if (waitFor) {
		args.push(factory.createTrue());

		const secondArg = node.arguments[1];
		if (secondArg) {
			args.push(secondArg);
		}
	}

	return factory.createCallExpression(
		factory.createIdentifier(
			REQUIRED_FUNCTIONS_BY_NAME.getInstanceFromPath,
		),
		typeArgument ? [typeArgument] : [],
		args,
	);
}

export const transformInstanceCallMacro: CallMacroFunction = (context, node) =>
	transformInstanceCallMacroInner(context, node, false);

export const transformInstanceWaitForCallMacro: CallMacroFunction = (
	context,
	node,
) => transformInstanceCallMacroInner(context, node, true);

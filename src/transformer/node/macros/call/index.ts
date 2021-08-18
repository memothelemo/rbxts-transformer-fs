import ts, { factory } from "typescript";
import { LogManager } from "../../../../shared/LogManager";
import { TransformContext } from "../../../context";

type CallMacroFunction = (
	context: TransformContext,
	node: ts.CallExpression,
) => ts.Node | ts.Node[];

export const CALL_MACROS: { [index: string]: CallMacroFunction } = {
	rtfsMacros: () => {
		LogManager.writeIfVerbose("Replacing rtfsMacros to 'Hello world!'");
		return factory.createStringLiteral("Hello world!");
	},
};

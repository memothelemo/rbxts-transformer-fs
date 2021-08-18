import ts from "typescript";
import { TransformContext } from "../../../context";

type CallMacroFunction = (context: TransformContext, node: ts.CallExpression) => ts.Node | ts.Node[];

export const CALL_MACROS: { [index: string]: CallMacroFunction } = {
	rtfsMacros: (context, node) => {
		console.log("Hi");
		return node;
	},
};

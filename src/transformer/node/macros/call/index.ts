import ts from "typescript";

import { TransformContext } from "../../../context";
import { transformFileNameCallMacro } from "./fileName";
import {
	transformGetFileCallMacro,
	transformGetFileWaitForCallMacro,
} from "./getFile";

export type CallMacroFunction = (
	context: TransformContext,
	node: ts.CallExpression,
) => ts.Node | ts.Node[];

export const CALL_MACROS: { [index: string]: CallMacroFunction } = {
	$fileName: transformFileNameCallMacro,
	$getFile: transformGetFileCallMacro,
	$getFileWaitFor: transformGetFileWaitForCallMacro,
};

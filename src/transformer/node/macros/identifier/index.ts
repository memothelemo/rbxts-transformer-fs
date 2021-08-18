import ts from "typescript";
import { TransformContext } from "../../../context";
import { transformFileNameIdMacro } from "./fileName";

export type IdentifierMacroFunction = (
	context: TransformContext,
	node: ts.Identifier,
) => ts.Node;

export const ID_MACROS: { [index: string]: IdentifierMacroFunction } = {
	$fileName: transformFileNameIdMacro,
};

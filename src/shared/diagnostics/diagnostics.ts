import ts from "typescript";
import { createDiagnosticWithLocation } from "./createDiagnosticWithLocation";

export type DiagnosticFactory<T = void> = (
	node: ts.Node,
	context: T,
) => ts.DiagnosticWithLocation;

function diagnostic(category: ts.DiagnosticCategory, message: string) {
	return (node: ts.Node) =>
		createDiagnosticWithLocation(message, category, node);
}

function warning(message: string) {
	return diagnostic(ts.DiagnosticCategory.Warning, message);
}

function error(message: string) {
	return diagnostic(ts.DiagnosticCategory.Error, message);
}

/**
 * All of the **SAFE** errors from rbxts-transformer-fs
 */
export const TransformerSafeErrors = {
	UNSUPPORTED_CALL_MACRO: (node: ts.CallExpression, functionName: string) =>
		error(`Unsupported call function: ${functionName}!`)(node),

	UNRESOLVED_ROJO: (node: ts.Node, name: string) =>
		error(`${name} was used but Rojo cannot be resolved`)(node),
};

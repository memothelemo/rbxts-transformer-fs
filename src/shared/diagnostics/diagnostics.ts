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
 * These are TypeScript diagnostics stuff from rbxts-transformer-fs
 */
export const TransformerDiagnostics = {
	UNSUPPORTED_CALL_MACRO: (node: ts.CallExpression, functionName: string) =>
		error(`Unsupported call function: ${functionName}!`)(node),

	USED_BUT_UNRESOLVED_ROJO: (node: ts.Node, name: string) =>
		error(`${name} was used but Rojo cannot be resolved`)(node),

	UNRESOLVED_ROJO: error(`Rojo cannot be resolved`),

	SOURCE_FILE_NOT_IN_ROJO_CONFIG: (node: ts.SourceFile) =>
		error(
			`${node.fileName} is not registered in the Rojo configuration, please register it!`,
		)(node),
};

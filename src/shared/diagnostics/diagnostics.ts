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

// eslint is going to scream if don't comment this
// function warning(message: string) {
// 	return diagnostic(ts.DiagnosticCategory.Warning, message);
// }

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

	GET_FILE_MACRO: {
		NOT_STRING: error(
			`Path argument must be a string or an identifier with complete string`,
		),
	},

	INVALID_PATH: error(`Cannot find the specific path from the argument`),

	COULD_NOT_FIND_ROJO_DATA: error(`Could not find rojo data`),

	UNRESOLVED_ROJO: error(`Rojo cannot be resolved`),

	UNEXPECTED_ERROR: error(`Unexpected error`),

	UNKNOWN_TYPE: error(`Unknown type!`),

	SOURCE_FILE_NOT_IN_ROJO_CONFIG: (node: ts.SourceFile) =>
		error(
			`${node.fileName} is not registered or part of the Rojo configuration, please register it!`,
		)(node),
};

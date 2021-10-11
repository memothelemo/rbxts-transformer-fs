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
	JSON_MACRO: {
		INVALID_JSON: (path: string) =>
			error(`${path} is an invalid JSON file, please check it again`),

		UNSUPPORTED_JSON_TYPE: (type: string) =>
			error(`Unsupported type: ${type}`),
	},

	RESOLVE_PATH_MACRO: {
		ARGS_NOT_COMPLETE: error(
			"$resolveFile was used but the arguments are not complete!",
		),
		INVALID_PATH_ARG: (id: number) =>
			error(`Invalid argument #${id}, it must be function-like value`),
	},

	REQUIRE_FILE: {
		NOT_FOUND: (path: string) => error(`'${path}' is required`),
		NOT_FILE: (path: string) => error(`'${path}' is not a file`),
	},

	GET_FILE_MACRO: {
		NOT_STRING: error(
			`Path argument must be a string or an identifier with complete string`,
		),
		INVALID_PATH: (node: ts.Node, absPath: string) =>
			error(
				`Cannot find the specific path from the argument (file location: ${absPath})`,
			)(node),
	},

	MACROS: {
		UNSUPPORTED_CALL: (node: ts.CallExpression, functionName: string) =>
			error(`Unsupported call function: ${functionName}!`)(node),

		UNSUPPORTED_IDENTIFIER: (node: ts.Identifier, name: string) =>
			error(`Unsupported identifier: ${name}`)(node),
	},

	USED_BUT_UNRESOLVED_ROJO: (node: ts.Node, name: string) =>
		error(`${name} was used but Rojo cannot be resolved`)(node),

	COULD_NOT_FIND_ROJO_DATA: (node: ts.Node, absPath: string) =>
		error(`Could not find rojo data (file location: ${absPath})`)(node),

	UNEXPECTED_ERROR: error(`Unexpected error`),
	UNKNOWN_TYPE: error(`Unknown type!`),
	SOURCE_FILE_NOT_IN_ROJO_CONFIG: (node: ts.SourceFile) =>
		error(
			`${node.fileName} is not registered or part of the Rojo configuration, please register it!`,
		)(node),
};

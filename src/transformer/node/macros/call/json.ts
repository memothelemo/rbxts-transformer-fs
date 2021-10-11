/* eslint-disable @typescript-eslint/ban-types */
import fs from "fs-extra";
import ts, { factory } from "typescript";
import { CallMacroFunction } from ".";
import { TransformerDiagnostics } from "../../../../shared/diagnostics/diagnostics";
import { DiagnosticError } from "../../../../shared/errors/diagnostic";
import { printIfVerbose } from "../../../../shared/functions/print";
import { warn } from "../../../../shared/functions/warn";
import { parseFileGetterCallExpression } from "../../../helpers/parseFileGetterCallExpression";

function parseBoolean(bool: boolean) {
	return bool ? factory.createTrue() : factory.createFalse();
}

function parseArrayObject(sourceNode: ts.Node, array: Array<unknown>) {
	return factory.createArrayLiteralExpression(
		array.map(value => parseValue(sourceNode, value)),
	);
}

function parseNumber(num: number) {
	return factory.createNumericLiteral(num);
}

function parseString(str: string) {
	return factory.createStringLiteral(str);
}

function parseValue(sourceNode: ts.Node, value: unknown): ts.Expression {
	const typeOfValue = typeof value;
	if (typeOfValue === "boolean") {
		return parseBoolean(value as boolean);
	} else if (typeOfValue === "string") {
		return parseString(value as string);
	} else if (Array.isArray(value)) {
		return parseArrayObject(sourceNode, value);
	} else if (typeOfValue === "number") {
		return parseNumber(value as number);
	} else if (typeOfValue === "object") {
		return visitJsonTree(sourceNode, value as object);
	}
	throw new DiagnosticError(
		TransformerDiagnostics.JSON_MACRO.UNSUPPORTED_JSON_TYPE(typeOfValue)(
			sourceNode,
		),
	);
}

function visitJsonTree(sourceNode: ts.Node, tree: object) {
	const assignments = new Array<ts.PropertyAssignment>();
	for (const [name, value] of Object.entries(tree)) {
		const propertyLiteral = factory.createStringLiteral(name);
		const initializer = parseValue(sourceNode, value);
		const assignment = factory.createPropertyAssignment(
			propertyLiteral,
			initializer,
		);

		assignments.push(assignment);
	}
	return factory.createObjectLiteralExpression(assignments);
}

export const transformJsonCallMacro: CallMacroFunction = (context, node) => {
	printIfVerbose("Transforming $json to ObjectLiteralExpression");
	warn(`'$json' is deprecreated, please use import(filePath) instead`);

	// get the file path
	const filePath = parseFileGetterCallExpression(context, node, false);

	if (Array.isArray(filePath)) {
		throw new DiagnosticError(
			TransformerDiagnostics.UNEXPECTED_ERROR(node),
		);
	}

	printIfVerbose("Reading JSON file");

	// load json file
	let data: object;
	try {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		data = fs.readJSONSync(filePath);
	} catch (_) {
		throw new DiagnosticError(
			TransformerDiagnostics.JSON_MACRO.INVALID_JSON(filePath)(node),
		);
	}

	printIfVerbose("Parsing JSON contents to ObjectLiteralExpression");

	return visitJsonTree(node, data);
};

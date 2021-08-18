/* eslint-disable @typescript-eslint/no-unused-vars */
import ts from "typescript";
import { TransformContext } from "../context";
import { getProjectRoot } from "./getProjectRoot";
import { makeGetInstanceFromPath } from "./makeGetInstanceFromPath";

export const REQUIRED_FUNCTIONS_BY_NAME = {
	getInstanceFromPath: "___getInstanceFromPath",
};

export const REQUIRED_FUNCTIONS = {
	[REQUIRED_FUNCTIONS_BY_NAME.getInstanceFromPath]: (
		context: TransformContext,
		sourceFile: ts.SourceFile,
	) => {
		const [root, stringRoot] = getProjectRoot(context, sourceFile);

		// to make it cleaner
		return makeGetInstanceFromPath(root, stringRoot) as ts.Statement[];
	},
} as const;

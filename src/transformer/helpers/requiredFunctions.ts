/* eslint-disable @typescript-eslint/no-unused-vars */
import ts from "typescript";
import { TransformContext } from "../context";
import { getProjectRoot } from "./getProjectRoot";
import { makeGetInstanceFromPath } from "./makeGetInstanceFromPath";

export const REQUIRED_FUNCTIONS = {
	___getInstanceFromPath: (
		context: TransformContext,
		sourceFile: ts.SourceFile,
	) => {
		const [root, stringRoot] = getProjectRoot(context, sourceFile);

		// to make it cleaner
		return makeGetInstanceFromPath(root, stringRoot);
	},
} as const;

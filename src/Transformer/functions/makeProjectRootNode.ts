import ts, { factory } from "typescript";
import RojoResolver from "../../RojoResolver";
import { Diagnostics } from "../../Shared/diagnostics";
import { TransformState } from "../state";
import { propertyAccessExpressionChain } from "../util/expressionChain";

export function makeProjectRootNode(state: TransformState, node: ts.Node) {
	state.printInVerbose("Making project root node");

	if (state.projectType === RojoResolver.ProjectType.Game) {
		return {
			node: factory.createIdentifier("game"),
			string: "game",
		};
	}

	const sourceFile = node.getSourceFile();

	if (!state.rojoResolver) {
		Diagnostics.error(
			node,
			"rbxts-transformer-path was imported but Rojo could not be resolved",
		);
	}

	const sourceOutPath = state.pathTranslator.getOutputPath(
		sourceFile.fileName,
	);

	const rbxPath = state.rojoResolver.getRbxPathFromFilePath(sourceOutPath);
	if (!rbxPath) {
		Diagnostics.error(node, "Unknown source file");
	}

	rbxPath.unshift("script");

	const relative = RojoResolver.Project.relativeToRootFromScript(rbxPath);
	const realNames = relative.map(v =>
		v === RojoResolver.RbxPathParent ? "Parent" : v,
	);
	const names = relative.map(v =>
		v === RojoResolver.RbxPathParent ? "Parent!" : v,
	);

	return {
		node: propertyAccessExpressionChain(state, names),
		string: realNames.join("."),
	};
}

import ts from "typescript";

/**
 * Adds comment with a node parameter in it.
 *
 * **NOTE**: JSDoc is not supported
 * @param node TypeScript node
 */
// took me billion years to make a comment in typescript....
export function addCommentFromNode(node: ts.Node, message: string) {
	// if the message has 2 two lines, then better use multline
	let useMultiline = false;
	if (message.split("\n").length > 1) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		useMultiline = true;
	}
	ts.addSyntheticLeadingComment(
		node,
		useMultiline
			? ts.SyntaxKind.MultiLineCommentTrivia
			: ts.SyntaxKind.SingleLineCommentTrivia,
		message,
		true,
	);
}

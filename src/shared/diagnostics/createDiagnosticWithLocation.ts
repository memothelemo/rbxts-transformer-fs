import ts from "typescript";
import { PKG_JSON } from "../util/package";

export function createDiagnosticWithLocation(
	message: string,
	category: ts.DiagnosticCategory,
	node: ts.Node,
): ts.DiagnosticWithLocation {
	return {
		category,
		code: ` ${PKG_JSON.name}` as unknown as number,
		file: node.getSourceFile(),
		messageText: message,
		length: node.getWidth(),
		start: node.getStart(),
	};
}

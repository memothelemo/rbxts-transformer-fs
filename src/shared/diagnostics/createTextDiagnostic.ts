import ts from "typescript";
import { PKG_JSON } from "../util/package";

export function createTextDiagnostic(
	messageText: string,
	category: ts.DiagnosticCategory = ts.DiagnosticCategory.Error,
): ts.Diagnostic {
	return {
		category,
		code: ` ${PKG_JSON.name}` as unknown as number,
		file: undefined,
		messageText,
		start: undefined,
		length: undefined,
	};
}

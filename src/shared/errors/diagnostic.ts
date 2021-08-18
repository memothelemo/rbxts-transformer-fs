import ts from "typescript";
import { formatDiagnostics } from "../diagnostics/formatDiagnostics";
import { BaseError } from "./base";

export class DiagnosticError extends BaseError {
	// obviously, this is TypeScript stuff
	public readonly withHeader = false;

	public constructor(public readonly diagnostic: ts.DiagnosticWithLocation) {
		super();
	}

	public toString() {
		return formatDiagnostics([this.diagnostic]);
	}
}

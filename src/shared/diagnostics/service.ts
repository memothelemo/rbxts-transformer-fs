import ts from "typescript";

export class DiagnosticService {
	private static diagnostic = new Array<ts.Diagnostic>();

	public static addDiagnostics(diagnostics: ts.Diagnostic[]) {
		this.diagnostic.push(...diagnostics);
	}

	public static flush() {
		const backup = this.diagnostic;
		this.diagnostic = [];

		return backup;
	}
}

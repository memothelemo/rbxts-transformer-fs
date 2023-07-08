import ts from "typescript";

export function hasErrorDiagnostics(diagnostics: readonly ts.Diagnostic[]) {
  return diagnostics.some(v => v.category === ts.DiagnosticCategory.Error);
}

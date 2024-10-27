import ts from "typescript";

export function getPreEmitDiagnostics(
    program: ts.Program,
    file: ts.SourceFile,
): readonly ts.Diagnostic[] {
    const originalFile = ts.getParseTreeNode(file, ts.isSourceFile);
    if (originalFile) {
        const preEmitDiagnostics = ts.getPreEmitDiagnostics(program, originalFile);
        return preEmitDiagnostics;
    }
    return [];
}

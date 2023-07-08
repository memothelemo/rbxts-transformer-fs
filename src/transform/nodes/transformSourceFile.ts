import { Diagnostics } from "shared/services/Diagnostics";
import { Logger } from "shared/services/Logger";
import { TransformState } from "transform/classes/TransformState";
import { f } from "transform/factory";
import ts from "typescript";
import { transformStatementList } from "./transformStatementList";
import { hasErrorDiagnostics } from "transform/utils/hasErrorDiagnostics";

export function transformSourceFile(state: TransformState, file: ts.SourceFile) {
  return Logger.benchmark(`Transforming file, path = ${state.project.relativeTo(file.fileName)}`, true, () => {
    // Precheck diagnostics before we transform because I'm too lazy
    // to evaluate TypeScript stuff every single error in this transformer.
    const originalFile = ts.getParseTreeNode(file, ts.isSourceFile);
    if (originalFile) {
      const preEmitDiagnostics = ts.getPreEmitDiagnostics(state.program, originalFile);
      if (hasErrorDiagnostics(preEmitDiagnostics)) {
        if (Logger.debugMode) Logger.warn("Error/s given from TypeScript, skipping file");
        preEmitDiagnostics.filter(ts.isDiagnosticWithLocation).forEach(v => state.context.addDiagnostic(v));
        return file;
      }
    }

    const statements = transformStatementList(state, file.statements);
    for (const diagnostic of Diagnostics.flush()) {
      state.context.addDiagnostic(diagnostic);
    }
    return f.update.sourceFile(file, statements);
  });
}

import ts from "typescript";
import { Diagnostics } from "core/classes/Diagnostics";
import { TransformState } from "transform/classes/TransformState";
import { transformStatementList } from "./transformStatementList";
import { factory } from "transform/factory";

export function transformSourceFile(state: TransformState, file: ts.SourceFile) {
  const statements = transformStatementList(state, file.statements);
  for (const diagnostic of Diagnostics.flush()) {
    state.addDiagnosticToTS(diagnostic);
  }
  return factory.update.sourceFile(file, statements);
}

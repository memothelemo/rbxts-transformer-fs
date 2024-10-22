import Diagnostics from "@transformer/shared/services/diagnostics";

import ts from "typescript";
import { TransformState } from "../state";
import { transformStatementList } from "./transformStatementList";
import { f } from "../factory";

export function transformFile(state: TransformState, file: ts.SourceFile) {
  const statements = transformStatementList(state, file.statements);
  for (const diagnostic of Diagnostics.flush()) {
    state.addDiagnostic(diagnostic);
  }

  const updated_file = f.update.source_file(file, statements);
  return updated_file;
}

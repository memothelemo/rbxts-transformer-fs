import { DiagnosticError, Diagnostics } from "shared/services/Diagnostics";
import { Logger } from "shared/services/Logger";

export function catchDiagnostic<T>(fallback: T, callback: () => T): T {
  const lastTree = Logger.treeStackLength;
  try {
    return callback();
  } catch (err) {
    if (err instanceof DiagnosticError) {
      Logger.treeStackLength = lastTree;
      Diagnostics.addDiagnostic(err.diagnostic);
      return fallback;
    }
    throw err;
  }
}

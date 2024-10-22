import Diagnostics, { DiagnosticError } from "@transformer/shared/services/diagnostics";
import Logger from "@transformer/shared/services/logger";

export function catchDiagnostic<T>(fallback: T, callback: () => T): T {
  const last_tree_stack = Logger.getTreeStack();
  try {
    return callback();
  } catch (error) {
    if (error instanceof DiagnosticError) {
      Logger.resetTreeStack(last_tree_stack);
      Logger.debugValue("Caught diagnostic error", error.stack);
      Diagnostics.addDiagnostic(error.diagnostic);
      return fallback;
    }
    throw error;
  }
}

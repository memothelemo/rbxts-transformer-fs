import { Logger } from "core/classes/Logger";
import { DiagnosticError, Diagnostics } from "core/classes/Diagnostics";
import ts from "typescript";

type Result<T> =
  | {
      readonly success: true;
      readonly value: T;
    }
  | {
      readonly success: false;
      readonly diagnostic: ts.DiagnosticWithLocation;
    };

export function captureDiagnostic<T>(callback: () => T): Result<T> {
  try {
    const value = callback();
    return { success: true, value };
  } catch (err) {
    if (err instanceof DiagnosticError) {
      return { success: false, diagnostic: err.diagnostic };
    }
    throw err;
  }
}

export function catchDiagnostic<T>(fallback: T, callback: () => T): T {
  const lastTreeStackLength = Logger.treeStackLength;
  const result = captureDiagnostic(callback);

  if (!result.success) {
    Logger.treeStackLength = lastTreeStackLength;
    Diagnostics.addDiagnostic(result.diagnostic);
    return fallback;
  }
  return result.value;
}

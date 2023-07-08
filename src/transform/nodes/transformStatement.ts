import { catchDiagnostic } from "shared/utils/diagnostics";
import { overrideArray } from "shared/utils/overrideArray";
import { TransformState } from "transform/classes/TransformState";
import ts from "typescript";
import { transformChildren } from "./transformChildren";

type Result = ts.Statement | ts.Statement[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TRANSFORMERS = new Map<ts.SyntaxKind, (state: TransformState, statement: any) => Result>([]);

export function transformStatement(state: TransformState, statement: ts.Statement) {
  const [node, prereqs] = state.capturePrereqStmts(() =>
    catchDiagnostic(statement, () => {
      const transformer = TRANSFORMERS.get(statement.kind);
      if (transformer !== undefined) {
        return transformer(state, statement);
      }
      return transformChildren(state, statement);
    }),
  );
  return [...prereqs, ...overrideArray(node)];
}

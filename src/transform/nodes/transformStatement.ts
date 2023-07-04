import { TransformState } from "transform/classes/TransformState";
import ts from "typescript";
import { transformChildren } from "./transformChildren";
import { catchDiagnostic } from "transform/utils/diagnostics";
import { toNodeArray } from "transform/utils/toNodeArray";

export type TransformStatementResult = ts.Statement | ts.Statement[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TRANSFORMERS = new Map<
  ts.SyntaxKind,
  (state: TransformState, statement: ts.Statement) => TransformStatementResult
>([]);

export function transformStatement(state: TransformState, statement: ts.Statement): TransformStatementResult {
  return catchDiagnostic<TransformStatementResult>(statement, () => {
    const [node, prereqs] = state.capturePrereqStmts(() => {
      const transformer = TRANSFORMERS.get(statement.kind);
      return transformer === undefined ? transformChildren(state, statement) : transformer(state, statement);
    });
    return [...prereqs, ...toNodeArray(node)];
  });
}

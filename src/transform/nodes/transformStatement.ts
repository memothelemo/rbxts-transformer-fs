import { catchDiagnostic } from "@transformer/shared/util/catchDiagnostic";
import ts from "typescript";
import { TransformState } from "../state";
import { overrideAsArray } from "@transformer/shared/util/overrideAsArray";
import { transformExpressionStatement } from "./statements/transformExpressionStatement";
import { transformNode } from "./transformNode";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TRANSFORMERS = new Map<
  ts.SyntaxKind,
  (state: TransformState, node: any) => ts.Statement | ts.Statement[]
>([[ts.SyntaxKind.ExpressionStatement, transformExpressionStatement]]);

export function transformStatement(
  state: TransformState,
  statement: ts.Statement,
): ts.Statement | ts.Statement[] {
  return catchDiagnostic<ts.Statement | ts.Statement[]>(statement, () => {
    const [node, prereqs] = state.capturePrereqStmts(() => {
      const transformer = TRANSFORMERS.get(statement.kind);
      if (transformer) return transformer(state, statement);

      return ts.visitEachChild(
        statement,
        new_node => transformNode(state, new_node),
        state.ts_context,
      );
    });
    return [...prereqs, ...overrideAsArray(node)];
  });
}

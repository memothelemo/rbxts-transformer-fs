import { overrideAsArray } from "@transformer/shared/util/overrideAsArray";
import ts from "typescript";
import { TransformState } from "../state";
import { transformStatement } from "./transformStatement";

export function transformStatementList(
  state: TransformState,
  statements: ReadonlyArray<ts.Statement>,
) {
  const result = new Array<ts.Statement>();
  for (const statement of statements) {
    const [new_stmts, prereqs] = state.capturePrereqStmts(() =>
      transformStatement(state, statement),
    );
    result.push(...prereqs);
    result.push(...overrideAsArray(new_stmts));
  }
  return result;
}

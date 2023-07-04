import { TransformState } from "transform/classes/TransformState";
import ts from "typescript";
import { transformStatement } from "./transformStatement";
import { toNodeArray } from "transform/utils/toNodeArray";

export function transformStatementList(state: TransformState, statements: ReadonlyArray<ts.Statement>): ts.Statement[] {
  const newStatementList = new Array<ts.Statement>();
  for (const statement of statements) {
    const [result, prereqStmts] = state.capturePrereqStmts(() => transformStatement(state, statement));
    newStatementList.push(...prereqStmts);
    newStatementList.push(...toNodeArray(result));
  }
  return newStatementList;
}

import { TransformState } from "transform/classes/TransformState";
import ts from "typescript";
import { transformStatement } from "./transformStatement";

export function transformStatementList(state: TransformState, statements: ReadonlyArray<ts.Statement>): ts.Statement[] {
  const list = new Array<ts.Statement>();
  for (const statement of statements) {
    // We already captured prereq statements
    list.push(...transformStatement(state, statement));
  }
  return list;
}

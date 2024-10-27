import { getNodeList } from "@shared/util/getNodeList";
import { State } from "@transform/state";
import ts from "typescript";
import { transformStatement } from "./transformStatement";

export function transformStatementList(
    state: State,
    statements: ReadonlyArray<ts.Statement>,
): ts.Statement[] {
    const result = new Array<ts.Statement>();
    for (const statement of statements) {
        const [newStatements, prereqs] = state.capture(() => transformStatement(state, statement));
        result.push(...prereqs);
        result.push(...getNodeList(newStatements));
    }
    return result;
}

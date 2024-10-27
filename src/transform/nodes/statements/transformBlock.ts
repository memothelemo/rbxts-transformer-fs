import { State } from "@transform/state";
import ts from "typescript";
import { TransformStmtResult } from "../transformStatement";
import { transformStatementList } from "../transformStatementList";
import { f } from "@transform/factory";

export function transformBlock(state: State, node: ts.Block): TransformStmtResult {
    return f.stmt.block(transformStatementList(state, node.statements));
}

import ts from "typescript";
import { TransformState } from "../state";

interface Macro {
  _deprecated?: string | true;
  _resolved_name?: string;

  getSymbol(state: TransformState): ts.Symbol | ts.Symbol[];
  transform(
    state: TransformState,
    node: ts.Node,
    source_symbol: ts.Symbol,
  ): ts.Node | ts.Node[] | undefined;
}

export interface CallMacro extends Macro {
  transform(
    state: TransformState,
    node: ts.CallExpression,
    source_symbol: ts.Symbol,
  ): ts.Expression;
}

export interface NonValueCallMacro extends Macro {
  transform(
    state: TransformState,
    node: ts.CallExpression,
    symbol: ts.Symbol,
  ): ts.Statement | ts.Statement[] | undefined;
}

export interface VariableMacro extends Macro {
  transform(
    state: TransformState,
    node: VariableAccessExpression,
    source_symbol: ts.Symbol,
  ): ts.Expression;
}

export type VariableAccessExpression =
  | ts.Identifier
  | ts.PropertyAccessExpression
  | ts.ElementAccessExpression;

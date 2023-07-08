import { SymbolProvider } from "transform/classes/SymbolProvider";
import { TransformState } from "transform/classes/TransformState";
import ts from "typescript";

export interface Macro {
  // TODO: Switch this SymbolProvider
  getSymbols(symbols: SymbolProvider, state: TransformState): ts.Symbol | ts.Symbol[];
  transform(state: TransformState, node: ts.Node): ts.Node | ts.Node[];
}

export const enum MacroKind {
  Call = "call",
  Variable = "identifier",
}

export interface LoadedMacro<T extends Macro = Macro> {
  deprecated?: { message?: string };
  kind: MacroKind;
  symbol: ts.Symbol;
  source: T;
}

export interface CallMacro extends Macro {
  transform(state: TransformState, node: ts.CallExpression): ts.Expression;
}

export interface VariableMacro extends Macro {
  transform(state: TransformState, node: VariableAccessExpression): ts.Expression;
}

export type VariableAccessExpression = ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression;

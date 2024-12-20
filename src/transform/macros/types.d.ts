import ts from "typescript";
import { State } from "@transform/state";

export interface MacroDefinition {
    getSymbols(state: State): ts.Symbol[];
    transform(
        state: State,
        node: ts.Node,
        symbol: ts.Symbol,
        loadedSymbols: ts.Symbol[],
    ): ts.Node | ts.Node[] | undefined;
}

export interface CallMacroDefinition extends MacroDefinition {
    transform(
        state: State,
        node: ts.CallExpression,
        symbol: ts.Symbol,
        loadedSymbols: ts.Symbol[],
    ): ts.Expression;
}

export interface StatementCallMacroDefinition extends MacroDefinition {
    transform(
        state: State,
        node: ts.CallExpression,
        symbol: ts.Symbol,
        loadedSymbols: ts.Symbol[],
    ): ts.Statement[] | undefined;
}

export type VariableAccessExpression =
    | ts.Identifier
    | ts.PropertyAccessExpression
    | ts.ElementAccessExpression;

export interface VariableMacroDefinition extends MacroDefinition {
    transform(state: State, node: VariableAccessExpression, sourceSymbol: ts.Symbol): ts.Expression;
}

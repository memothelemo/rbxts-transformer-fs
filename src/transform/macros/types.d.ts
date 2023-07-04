import ts from "typescript";
import { TransformState } from "transform/classes/TransformState";
import { VariableLikeExpression } from "transform/types";

interface Macro {
  // let MacroManager deal with deprecation stuff
  getSymbols(state: TransformState): ts.Symbol | ts.Symbol[];
  transform(state: TransformState, node: ts.Node): ts.Node | ts.Node[] | undefined;
}

export type DeprecatedMacroInfo = { deprecated: true; deprecatedMessage?: string } | { deprecated: false };

export interface CallMacro extends Macro {
  transform(state: TransformState, node: ts.CallExpression): ts.Expression | void;
}

export interface VariableMacro extends Macro {
  transform(state: TransformState, node: VariableLikeExpression): ts.Expression | void;
}

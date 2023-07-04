import ts from "typescript";
import { CALL_MACROS } from "transform/macros/call";
import { TransformState } from "./TransformState";
import { assert } from "utils/functions/assert";
import { CallMacro, DeprecatedMacroInfo, VariableMacro } from "transform/macros/types";
import { Logger } from "core/classes/Logger";
import { VARIABLE_MACROS } from "transform/macros/variable";

type CallMacroInfo = CallMacro & DeprecatedMacroInfo;
type VariableMacroInfo = VariableMacro & DeprecatedMacroInfo;

type GetDeprecatedInfo = [true, string | undefined] | [false, undefined];

export class FsMacroManager {
  private callMacros = new Map<ts.Symbol, CallMacroInfo>();
  private variableMacros = new Map<ts.Symbol, VariableMacroInfo>();

  constructor(state: TransformState) {
    for (const macro of CALL_MACROS) {
      let symbols = macro.getSymbols(state);
      if (!Array.isArray(symbols)) symbols = [symbols];

      for (const symbol of symbols) {
        assert(!this.callMacros.has(symbol), `Call macro symbols must be unique, name = ${symbol.name}`);

        // We have to resolve the deprecation stuff
        const declaration = symbol.valueDeclaration;
        assert(declaration, "Call macro symbols must have declaration");

        Logger.debug(`Found call symbol, macro.name = ${symbol.name}`);
        this.callMacros.set(symbol, this.makeMacro(macro, this.getDeprecatedInfo(declaration)));
      }
    }

    for (const macro of VARIABLE_MACROS) {
      let symbols = macro.getSymbols(state);
      if (!Array.isArray(symbols)) symbols = [symbols];

      for (const symbol of symbols) {
        assert(!this.variableMacros.has(symbol), `Variable macro symbols must be unique, name = ${symbol.name}`);

        // We have to resolve the deprecation stuff
        const declaration = symbol.valueDeclaration;
        assert(declaration, "Variable macro symbols must have declaration");

        Logger.debug(`Found variable symbol, macro.name = ${symbol.name}`);
        this.variableMacros.set(symbol, this.makeMacro(macro, this.getDeprecatedInfo(declaration)));
      }
    }
  }

  private makeMacro<T>(macro: T, [deprecated, message]: GetDeprecatedInfo): T & DeprecatedMacroInfo {
    return { deprecated, deprecatedMessage: message, ...macro };
  }

  private getDeprecatedInfo(node: ts.Node): GetDeprecatedInfo {
    const tags = ts.getJSDocTags(node);
    for (const tag of tags) {
      if (tag.tagName.text === "deprecated") {
        if (typeof tag.comment === "string") {
          return [true, tag.comment];
        }
        return [true, undefined];
      }
    }
    return [false, undefined];
  }

  public getCallMacro(symbol: ts.Symbol) {
    return this.callMacros.get(symbol);
  }

  public getVariableMacro(symbol: ts.Symbol) {
    return this.variableMacros.get(symbol);
  }

  public getTotalMacros() {
    return this.callMacros.size + this.variableMacros.size;
  }
}

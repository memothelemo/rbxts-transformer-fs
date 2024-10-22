import { assert } from "@transformer/shared/util/assert";
import Logger from "@transformer/shared/services/logger";
import ts from "typescript";
import { CallMacro, Macro, NonValueCallMacro, VariableMacro } from "../macros/types";
import { CALL_MACROS, NON_VALUE_CALL_MACROS, VARIABLE_MACROS } from "../macros";
import { TransformState } from "../state";

export class MacroManager {
  private call_macros = new Map<ts.Symbol, CallMacro>();
  private non_value_call_macros = new Map<ts.Symbol, NonValueCallMacro>();
  private variable_macros = new Map<ts.Symbol, VariableMacro>();

  public constructor(private state: TransformState) {
    // Don't try to load macros otherwise we will get a crash because
    // one of the macros requires the module file `index.d.ts` to be
    // referenced from the project so we can get the function/variable
    // information.
    const symbol_provider = state.symbol_provider;
    if (!symbol_provider.isModuleFileLoaded) return;

    for (const macro of NON_VALUE_CALL_MACROS) {
      this.setupCommonMacro(macro, this.non_value_call_macros);
    }

    for (const macro of CALL_MACROS) {
      this.setupCommonMacro(macro, this.call_macros);
    }

    for (const macro of VARIABLE_MACROS) {
      this.setupCommonMacro(macro, this.variable_macros);
    }
  }

  public get isLoaded() {
    return this.state.symbol_provider.isModuleFileLoaded;
  }

  public countAllLoadedMacros() {
    return this.call_macros.size + this.variable_macros.size;
  }

  public getNonValueCallMacro(symbol: ts.Symbol) {
    return this.non_value_call_macros.get(symbol);
  }

  public getCallMacro(symbol: ts.Symbol) {
    return this.call_macros.get(symbol);
  }

  public getVariableMacro(symbol: ts.Symbol) {
    return this.variable_macros.get(symbol);
  }

  private intoSymbolsArray(value: ts.Symbol | ts.Symbol[]) {
    return Array.isArray(value) ? value : [value];
  }

  private setupCommonMacro(macro: Macro, map: Map<ts.Symbol, Macro>) {
    const symbols = this.intoSymbolsArray(macro.getSymbol(this.state));
    for (const symbol of symbols) {
      // We have to resolve the deprecation stuff
      const declaration = symbol.valueDeclaration;
      assert(declaration, "Every macros must have any declaration");

      const source_declaration = this.state.getSourceFileOfNode(declaration);
      assert(
        !map.has(symbol),
        `${symbol.name} declared from ${source_declaration.fileName} is already defined`,
      );

      Logger.debug(`initializing ${symbol.name} macro...`);
      const deprecated_message = this.state.getJSDocTagContent(declaration, "deprecated");
      if (macro._deprecated === undefined && deprecated_message != null) {
        macro._deprecated = typeof deprecated_message === "string" ? deprecated_message : true;
      }

      macro._resolved_name = symbol.name;
      Logger.debugValue(`initialized "${symbol.name}" macro`, {
        name: symbol.name,
        deprecated: macro._deprecated !== undefined,
      });
      map.set(symbol, macro);
    }
  }
}

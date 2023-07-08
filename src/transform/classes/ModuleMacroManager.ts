import { CallMacro, LoadedMacro, Macro, MacroKind, VariableMacro } from "transform/macros/types";
import ts from "typescript";
import { Logger } from "shared/services/Logger";
import { assert } from "shared/utils/assert";
import { overrideArray } from "shared/utils/overrideArray";
import { CALL_MACROS } from "transform/macros/call";
import { VARIABLE_MACROS } from "transform/macros/variable";
import { getJSDocTagContent } from "transform/utils/getJSDocTagContent";
import { SymbolProvider } from "./SymbolProvider";

export class ModuleMacroManager {
  private callVariables = new Map<ts.Symbol, LoadedMacro<CallMacro>>();
  private variables = new Map<ts.Symbol, LoadedMacro<VariableMacro>>();

  public constructor(provider: SymbolProvider) {
    // Otherwise it will be a fiasco
    if (!provider.isModuleFileLoaded()) {
      Logger.debug("Module file is not loaded, aborting...");
      return;
    }

    for (const macro of CALL_MACROS) {
      const symbols = overrideArray(macro.getSymbols(provider, provider.state));
      for (const symbol of symbols) {
        assert(!this.variables.has(symbol), `Call macro, ${symbol.name} is already initialized`);

        // We have to resolve the deprecation stuff
        const declaration = symbol.valueDeclaration;
        assert(declaration, "Every macros must have any sort kind of declaration");

        const depMessage = getJSDocTagContent(declaration, "deprecated");
        let deprecated: LoadedMacro["deprecated"];
        if (depMessage !== undefined) {
          deprecated = { message: typeof depMessage === "string" ? depMessage : undefined };
        }

        Logger.debug(`Found call macro, macro.name = ${symbol.name}, macro.deprecated = ${deprecated !== undefined}`);
        this.callVariables.set(symbol, this.makeMacro(deprecated, MacroKind.Call, symbol, macro));
      }
    }

    for (const macro of VARIABLE_MACROS) {
      const symbols = overrideArray(macro.getSymbols(provider, provider.state));
      for (const symbol of symbols) {
        assert(!this.variables.has(symbol), `Variable macro, ${symbol.name} is already initialized`);

        // We have to resolve the deprecation stuff
        const declaration = symbol.valueDeclaration;
        assert(declaration, "Every macros must have any sort kind of declaration");

        const depMessage = getJSDocTagContent(declaration, "deprecated");
        let deprecated: LoadedMacro["deprecated"];
        if (depMessage !== undefined) {
          deprecated = { message: typeof depMessage === "string" ? depMessage : undefined };
        }

        Logger.debug(
          `Found variable macro, macro.name = ${symbol.name}, macro.deprecated = ${deprecated !== undefined}`,
        );
        this.variables.set(symbol, this.makeMacro(deprecated, MacroKind.Variable, symbol, macro));
      }
    }
  }

  public getCallMacro(symbol: ts.Symbol) {
    return this.callVariables.get(symbol);
  }

  public getVariableMacro(symbol: ts.Symbol) {
    return this.variables.get(symbol);
  }

  public countAllMacros() {
    return this.variables.size + this.callVariables.size;
  }

  private makeMacro<T extends Macro>(
    deprecated: LoadedMacro<T>["deprecated"],
    kind: MacroKind,
    symbol: ts.Symbol,
    source: T,
  ) {
    return { deprecated, kind, symbol, source };
  }
}

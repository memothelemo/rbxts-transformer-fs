import Logger from "@shared/services/logger";
import { assert } from "@shared/util/assert";
import { sanitizeInput } from "@shared/util/sanitizeInput";
import { CALL_MACROS, STATEMENT_CALL_MACROS } from "@transform/macros/call";
import { VARIABLE_MACROS } from "@transform/macros/variable";
import {
    CallMacroDefinition,
    MacroDefinition,
    StatementCallMacroDefinition,
    VariableMacroDefinition,
} from "@transform/macros/types";
import { State } from "@transform/state";
import ts from "typescript";

export type LoadedMacro<T extends MacroDefinition = MacroDefinition> = {
    deprecated: string | boolean;
    loadedSymbols: ts.Symbol[];
} & T;

export class MacroManager {
    public constructor(private state: State) {
        // Don't try to load macros if SymbolProvider hasn't loaded symbols
        // from `index.d.ts` otherwise we will get a crash.
        if (!state.symbolProvider.isModuleLoaded()) return;

        for (const macro of CALL_MACROS) this.setupMacros(macro, this.callMacros);
        for (const macro of VARIABLE_MACROS) this.setupMacros(macro, this.variableMacros);
        for (const macro of STATEMENT_CALL_MACROS)
            this.setupMacros(macro, this.statementCallMacros);
    }

    public get loadedMacros() {
        return this.callMacros.size + this.variableMacros.size;
    }

    public getStatementCallMacro(symbol: ts.Symbol) {
        return this.statementCallMacros.get(symbol);
    }

    public getCallMacro(symbol: ts.Symbol) {
        return this.callMacros.get(symbol);
    }

    public getVariableMacro(symbol: ts.Symbol) {
        return this.variableMacros.get(symbol);
    }

    public setupMacros<T extends MacroDefinition>(
        macro: T,
        registry: Map<ts.Symbol, LoadedMacro<T>>,
    ) {
        const symbols = macro.getSymbols(this.state);
        for (const symbol of symbols) {
            // We have to resolve the deprecation stuff
            const declaration = symbol.valueDeclaration;
            assert(declaration, `Couldn't find declaration for ${symbol.name}`);

            const sourceDeclaration = this.state.getSourceFileOfNode(declaration);
            assert(
                !registry.has(symbol),
                `${symbol.name} declared from ${sourceDeclaration.fileName} is already defined`,
            );

            const deprecatedMessage = this.state.getJSDocTagContent(declaration, "deprecated");
            const deprecatedField =
                typeof deprecatedMessage === "string"
                    ? deprecatedMessage
                    : deprecatedMessage != null;

            const loadedMacro: LoadedMacro<T> = {
                deprecated: deprecatedField,
                loadedSymbols: symbols,
                ...macro,
            };
            registry.set(symbol, loadedMacro);

            if (this.state.config.$internal.logDeclaredMacros && this.state.config.debug) {
                Logger.push(`Loaded macro: ${symbol.name}`);
                Logger.value("macro.deprecated", loadedMacro.deprecated !== false);
                if (loadedMacro.deprecated !== false) {
                    const msg =
                        typeof loadedMacro.deprecated === "string"
                            ? sanitizeInput(loadedMacro.deprecated)
                            : "<unknown>";

                    Logger.value("macro.deprecated.message", msg);
                }
                const alikeSymbols = loadedMacro.loadedSymbols.map(v => v.name).join(", ");
                Logger.value("macro.alikeSymbols", alikeSymbols);
                Logger.pop();
            }
        }
    }

    private statementCallMacros = new Map<ts.Symbol, LoadedMacro<StatementCallMacroDefinition>>();
    private callMacros = new Map<ts.Symbol, LoadedMacro<CallMacroDefinition>>();
    private variableMacros = new Map<ts.Symbol, LoadedMacro<VariableMacroDefinition>>();
}

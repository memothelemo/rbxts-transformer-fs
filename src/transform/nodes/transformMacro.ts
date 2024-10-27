/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoadedMacro } from "@transform/classes/MacroManager";
import Diagnostics from "@shared/services/diagnostics";
import Logger from "@shared/services/logger";
import { State } from "@transform/state";
import ts from "typescript";
import { MacroDefinition } from "../macros/types";

type SecondParameter<T> = T extends (first: any, second: infer A, ...args: any) => any ? A : any;

export function transformMacro<D extends MacroDefinition, T extends LoadedMacro<D>>(
    state: State,
    macro: T,
    node: SecondParameter<T["transform"]>,
    symbol: ts.Symbol,
): ReturnType<T["transform"]> {
    const name = symbol.name;
    if (macro.deprecated !== false) {
        let message = `${name} is deprecated.`;
        if (macro.deprecated !== true) message += ` ${macro.deprecated}`;
        Diagnostics.warn(node, message);
    }

    const { line, column } = state.getLineAndColumnOfNode(node);
    return Logger.benchmark("Transforming macro", () => {
        Logger.value("macro.deprecated", () => macro.deprecated !== false);
        Logger.value("macro.name", symbol.name);
        Logger.value("node.kind", () => ts.SyntaxKind[node.kind]);
        if (state.config.$internal.logAllFiles === false) {
            const fileName = node.getSourceFile().fileName;
            Logger.value("node.source", () => state.project.relativeFromDir(fileName));
        }
        Logger.value("source.column", column);
        Logger.value("source.line", line);
        return macro.transform(state, node, symbol, macro.loadedSymbols);
    }) as any;
}

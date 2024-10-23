import Diagnostics from "@shared/services/diagnostics";
import Logger from "@shared/services/logger";
import { f } from "@transform/factory";
import MacroIntrinsics from "../intrinsics";
import { CallMacroDefinition } from "../types";
import { assert } from "@shared/util/assert";

export const ExistsMacro: CallMacroDefinition = {
    getSymbols(state) {
        const module = state.symbolProvider.module;
        return [
            module.expect("$fileExists"),
            module.expect("$dirExists"),
            module.expect("$pathExists"),
        ];
    },

    transform(state, node, symbol, loadedSymbols) {
        const [firstArg] = node.arguments;
        if (!f.is.string(firstArg)) Diagnostics.error(firstArg ?? node, "Expected string");

        const resolvedPath = MacroIntrinsics.resolvePath(state, node, firstArg.text);
        Logger.value("resolvedPath", () => state.project.relativeFromDir(resolvedPath));

        const fileSymbol = loadedSymbols[0];
        const dirSymbol = loadedSymbols[1];
        const pathSymbol = loadedSymbols[2];

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let checker = (_path: string) => true;
        if (symbol === fileSymbol) {
            checker = MacroIntrinsics.isFile;
        } else if (symbol === dirSymbol) {
            checker = MacroIntrinsics.isDirectory;
        } else if (symbol === pathSymbol) {
            checker = MacroIntrinsics.isPathExists;
        } else {
            assert(false, `${symbol.name} is not unimplemented`);
        }

        const exists = checker(resolvedPath);

        // Generalize the boolean literal type into boolean type otherwise TypeScript
        // will recognize the type of value as a value of the boolean itself.
        return f.as(f.bool(exists), f.type.reference("boolean"));
    },
};

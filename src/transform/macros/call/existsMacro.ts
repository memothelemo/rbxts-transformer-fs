import { f } from "@transform/factory";
import { CallMacroDefinition } from "../types";
import Diagnostics from "@shared/services/diagnostics";
import MacroUtil from "../util";
import Logger from "@shared/services/logger";
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
        const firstArg = node.arguments.at(0);
        if (!f.is.string(firstArg)) Diagnostics.error(firstArg ?? node, "Expected string");

        const path = MacroUtil.resolvePath(state, node, firstArg.text);
        Logger.value("args.path", () => state.project.relativeFromDir(path));

        const [fileSymbol, dirSymbol, pathSymbol] = loadedSymbols;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let checker = (_path: string) => true;
        if (symbol === fileSymbol) {
            checker = MacroUtil.isFile;
        } else if (symbol === dirSymbol) {
            checker = MacroUtil.isDirectory;
        } else if (symbol === pathSymbol) {
            checker = MacroUtil.isPathExists;
        } else {
            assert(false, `${symbol.name} is not unimplemented`);
        }

        const exists = checker(path);

        // Generalize the boolean literal type into boolean type otherwise TypeScript
        // will recognize the type of value as a value of the boolean itself.
        return f.as(f.bool(exists), f.type.reference("boolean"));
    },
};

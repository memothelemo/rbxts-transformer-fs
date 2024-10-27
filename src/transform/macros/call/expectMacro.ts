import Diagnostics from "@shared/services/diagnostics";
import Logger from "@shared/services/logger";
import { assert } from "@shared/util/assert";
import { sanitizeInput } from "@shared/util/sanitizeInput";
import { f } from "@transform/factory";
import { StatementCallMacroDefinition } from "../types";
import MacroUtil from "../util";

export const ExpectMacro: StatementCallMacroDefinition = {
    getSymbols(state) {
        const module = state.symbolProvider.module;
        return [
            module.expect("$expectFile"),
            module.expect("$expectDir"),
            module.expect("$expectPath"),
        ];
    },

    transform(state, node, symbol, loadedSymbols) {
        const [firstArg, secondArg] = node.arguments;
        if (!f.is.string(firstArg)) Diagnostics.error(firstArg ?? node, "Expected string");

        let errorMessage = "Specified path not found";
        if (secondArg && !f.is.string(secondArg)) Diagnostics.error(secondArg, "Expected string");
        if (secondArg && secondArg.text.length === 0)
            Diagnostics.error(secondArg, "Error message should not be empty");

        if (secondArg) errorMessage = secondArg.text;

        const path = MacroUtil.resolvePath(state, node, f.value.string(firstArg));
        Logger.value("args.message", () => sanitizeInput(errorMessage));
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
        Logger.value("args.path.exists", exists);

        if (!exists) Diagnostics.error(firstArg, errorMessage);
        return undefined;
    },
};

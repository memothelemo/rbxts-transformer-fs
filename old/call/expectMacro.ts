import Diagnostics from "@shared/services/diagnostics";
import { sanitizeInput } from "@shared/util/sanitizeInput";
import Logger from "@shared/services/logger";
import { assert } from "@shared/util/assert";
import { f } from "@transform/factory";
import MacroIntrinsics from "../intrinsics";
import { StatementCallMacroDefinition } from "../types";

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
        if (secondArg !== undefined) {
            if (!f.is.string(secondArg)) Diagnostics.error(secondArg, "Expected string");
            if (!secondArg) Diagnostics.error(secondArg, "Error message should not be empty");
            errorMessage = sanitizeInput(f.value.string(secondArg));
        }

        const path = MacroIntrinsics.resolvePath(state, node, f.value.string(firstArg));
        Logger.value("args.message", errorMessage);

        const [fileSymbol, dirSymbol, pathSymbol] = loadedSymbols;

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

        const exists = checker(path);
        Logger.value("args.path.exists", exists);

        if (!exists) Diagnostics.error(firstArg, errorMessage);
        return undefined;
    },
};

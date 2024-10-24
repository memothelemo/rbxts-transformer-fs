import Diagnostics from "@shared/services/diagnostics";
import Logger from "@shared/services/logger";
import { f } from "@transform/factory";
import fs from "fs";
import MacroIntrinsics from "../intrinsics";
import { CallMacroDefinition } from "../types";

export const ReadFileMacro: CallMacroDefinition = {
    getSymbols(state) {
        const module = state.symbolProvider.module;
        return [module.expect("$readFile")];
    },

    transform(state, node) {
        const firstArg = node.arguments[0];
        if (!f.is.string(firstArg)) Diagnostics.error(firstArg ?? node, "Expected string");

        const secondArg = node.arguments.at(1);
        let optional = false;

        if (secondArg !== undefined) {
            if (!f.is.bool(secondArg)) Diagnostics.error(secondArg, "Expected bool");
            optional = f.value.bool(secondArg);
        }

        const path = MacroIntrinsics.resolvePath(state, node, f.value.string(firstArg));
        Logger.value("args.optional", optional);

        if (!MacroIntrinsics.isFile(path)) {
            if (optional) return f.nil();
            Diagnostics.error(firstArg, "Cannot find specified file");
        }

        MacroIntrinsics.checkOrThrowFiieSize(
            state,
            path,
            state.config.readFileSizeLimit,
            "reading",
            "readFileSizeLimit",
            firstArg,
        );

        try {
            const data = fs.readFileSync(path).toString();
            return f.string(data);
        } catch (_) {
            Diagnostics.error(firstArg, "Could not read specified file");
        }
    },
};

import Diagnostics from "@shared/services/diagnostics";
import Logger from "@shared/services/logger";
import { f } from "@transform/factory";
import fs from "fs";
import { CallMacroDefinition } from "../types";
import MacroUtil from "../util";

export const ReadFileMacro: CallMacroDefinition = {
    getSymbols(state) {
        const module = state.symbolProvider.module;
        return [module.expect("$readFile")];
    },

    transform(state, node) {
        const firstArg = node.arguments.at(0);
        if (!f.is.string(firstArg)) Diagnostics.error(firstArg ?? node, "Expected string");

        const secondArg = node.arguments.at(1);
        let optional = false;

        if (secondArg) {
            if (!f.is.bool(secondArg)) Diagnostics.error(secondArg, "Expected boolean");
            optional = f.value.bool(secondArg);
        }

        const path = MacroUtil.resolvePath(state, node, f.value.string(firstArg));
        Logger.value("args.path", () => state.project.relativeFromDir(path));
        Logger.value("args.optional", optional);

        if (!MacroUtil.isFile(path)) {
            if (optional) return f.nil();
            Diagnostics.error(firstArg, "Cannot find specified file");
        }

        MacroUtil.getOrThrowFileSize(
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

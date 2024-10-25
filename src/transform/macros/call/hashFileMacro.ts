import { HashAlgorithm, hashBigFile, hashFile } from "@shared/util/hashFile";
import { CallMacroDefinition } from "../types";
import Diagnostics from "@shared/services/diagnostics";
import { f } from "@transform/factory";
import MacroUtil from "../util";
import { sanitizeInput } from "@shared/util/sanitizeInput";
import Logger from "@shared/services/logger";
import { PACKAGE_NAME } from "@shared/constants";

function intoAlgorithmEnum(value: string): HashAlgorithm | undefined {
    switch (value) {
        case "sha1":
            return HashAlgorithm.SHA1;
        case "sha256":
            return HashAlgorithm.SHA256;
        case "sha512":
            return HashAlgorithm.SHA512;
        case "md5":
            return HashAlgorithm.MD5;
        default:
            return undefined;
    }
}

// 10 mb is our limit to our memory reading method
const STREAMING_BYTES_THRESHOLD = 10_000_000;

export const HashFileMacro: CallMacroDefinition = {
    getSymbols(state) {
        const module = state.symbolProvider.module;
        return [module.expect("$hashFile")];
    },

    // TODO: Implement incremental file hashing system to make files faster to hash
    transform(state, node) {
        const [firstArg, secondArg] = node.arguments;
        if (!f.is.string(firstArg)) Diagnostics.error(firstArg ?? node, "Expected string");
        if (!f.is.string(secondArg)) Diagnostics.error(secondArg ?? node, "Expected string");

        const path = MacroUtil.resolvePath(state, node, firstArg.text);
        const algorithm = intoAlgorithmEnum(secondArg.text);
        Logger.value("args.path", () => state.project.relativeFromDir(path));
        Logger.value("args.algorithm", () => sanitizeInput(algorithm ?? "<unknown>"));

        if (algorithm === undefined) {
            Diagnostics.error(
                secondArg,
                `${PACKAGE_NAME} does not support this specific hash algorithm`,
            );
        }

        const fileSize = MacroUtil.getOrThrowFileSize(
            state,
            path,
            state.config.hashFileSizeLimit,
            "hashing",
            "hashFileSizeLimit",
            firstArg,
        );
        const shouldUseStreaming = fileSize >= STREAMING_BYTES_THRESHOLD;
        Logger.value("hash.streaming", shouldUseStreaming);

        try {
            const hash = shouldUseStreaming
                ? hashFile(path, algorithm)
                : hashBigFile(path, algorithm);

            return f.string(hash);
        } catch {
            Diagnostics.error(secondArg, "Could not hash file");
        }
    },
};

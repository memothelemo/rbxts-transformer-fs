import { Diagnostics } from "shared/services/Diagnostics";
import { Logger } from "shared/services/Logger";
import { assert } from "shared/utils/assert";
import { formatFileSize } from "shared/utils/formatFileSize";
import { hashFile } from "shared/utils/hashFile";
import { f } from "transform/factory";
import { macros } from "transform/macros";
import { CallMacro } from "../types";

const SUPPORTED_ALGORITHMS = ["sha1", "sha256", "sha512", "md5"];

export const HashFileMacro: CallMacro = {
  getSymbols(symbols) {
    return symbols.moduleFile.getFromExport("$hashFile");
  },

  transform(state, node) {
    const firstArg = node.arguments[0];
    if (!f.is.string(firstArg)) Diagnostics.error(firstArg, "Invalid path argument");

    const secondArg = node.arguments[1];
    if (!f.is.string(secondArg)) Diagnostics.error(secondArg, "Algorithm argument must be string");

    const path = macros.utils.resolvePath(state, firstArg, macros.utils.getStringValue(firstArg));
    const algorithm = macros.utils.getStringValue(secondArg);
    Logger.debug(`path = ${state.project.relativeTo(path)}, algorithm = ${algorithm}`);

    if (!macros.utils.isFile(path)) Diagnostics.error(firstArg, "Specified file not found");

    const fileSize = macros.utils.getFileSize(path);
    assert(fileSize !== undefined);

    const { hashFileSizeLimit } = state.config;
    if (fileSize > hashFileSizeLimit) {
      Diagnostics.error(
        firstArg,
        `This file reached size limit (limit = ${formatFileSize(hashFileSizeLimit)}, actual = ${formatFileSize(
          fileSize,
        )})`,
      );
    }

    if (!SUPPORTED_ALGORITHMS.includes(algorithm))
      Diagnostics.error(secondArg, `Unsupported/unimplemented ${algorithm} algorithm`);

    const hash = Logger.benchmark("Hashing file contents", false, () => hashFile(path, algorithm));
    return f.string(hash);
  },
};

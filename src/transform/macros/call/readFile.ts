import fs from "fs";
import { Diagnostics } from "shared/services/Diagnostics";
import { Logger } from "shared/services/Logger";
import { assert } from "shared/utils/assert";
import { formatFileSize } from "shared/utils/formatFileSize";
import { macros } from "transform/macros";
import { f } from "transform/factory";
import { CallMacro } from "../types";

export const ReadFileMacro: CallMacro = {
  getSymbols(symbols) {
    return symbols.moduleFile.getFromExport("$readFile");
  },

  transform(state, node) {
    const firstArg = node.arguments[0];
    if (!f.is.string(firstArg)) Diagnostics.error(firstArg, "Invalid path argument");

    const secondArg = node.arguments[1];
    let optional = false;

    if (secondArg !== undefined) {
      if (!f.is.bool(secondArg)) Diagnostics.error(secondArg, "Expected boolean value");
      optional = macros.utils.getBooleanValue(secondArg);
    }

    const path = macros.utils.resolvePath(state, firstArg, macros.utils.getStringValue(firstArg));
    Logger.debug(`path = ${state.project.relativeTo(path)}, optional = ${optional}`);

    if (!macros.utils.isFile(path)) {
      if (!optional) Diagnostics.error(firstArg, "Specified file not found");
      return f.nil();
    }

    const fileSize = macros.utils.getFileSize(path);
    assert(fileSize !== undefined);

    const { readFileSizeLimit } = state.config;
    if (fileSize > readFileSizeLimit) {
      Diagnostics.error(
        firstArg,
        `This file reached size limit (limit = ${formatFileSize(readFileSizeLimit)}, actual = ${formatFileSize(
          fileSize,
        )})`,
      );
    }

    return f.string(fs.readFileSync(path).toString());
  },
};

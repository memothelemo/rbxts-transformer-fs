import { f } from "@transformer/main/factory";
import Diagnostics from "@transformer/shared/services/diagnostics";
import Logger from "@transformer/shared/services/logger";
import fs from "fs";

import { macroFsUtils } from "../utils/filesystem";
import { CallMacro } from "../types";

export const ReadFileMacro: CallMacro = {
  getSymbol(state) {
    return state.symbol_provider.module_file.expect("$readFile");
  },

  transform(state, node) {
    const first_argument = node.arguments[0];
    if (!f.is.string(first_argument))
      Diagnostics.error(first_argument, "Expected file path as string");

    const second_argument = node.arguments[1];
    let optional = false;

    if (second_argument !== undefined) {
      if (!f.is.bool(second_argument)) Diagnostics.error(second_argument, "Expected boolean value");
      optional = f.value.bool(second_argument);
    }

    const path = macroFsUtils.resolvePathArgument(
      state,
      first_argument,
      f.value.string(first_argument),
    );
    Logger.debugValue("path", () => state.project.relative_path_to(path));
    Logger.debugValue("optional", optional);

    if (!macroFsUtils.isFile(path)) {
      if (!optional) Diagnostics.error(first_argument, "Specified file not found");
      return f.nil();
    }
    macroFsUtils.checkOrThrowFileSizeLimit(
      path,
      state.config,
      macroFsUtils.FileSizeCheckMode.Reading,
      first_argument,
    );

    return f.string(fs.readFileSync(path).toString());
  },
};

import { f } from "@transformer/main/factory";

import { PACKAGE_NAME } from "@transformer/shared/consts";
import Diagnostics from "@transformer/shared/services/diagnostics";
import Logger from "@transformer/shared/services/logger";
import { HashAlgorithm, hashFile } from "@transformer/shared/util/hashFile";

import { macroFsUtils } from "../utils/filesystem";
import { CallMacro } from "../types";
import { sanitizeInput } from "@transformer/shared/util/sanitizeInput";

function into_algorithm_enum(value: string): HashAlgorithm | undefined {
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

export const HashFileMacro: CallMacro = {
  getSymbol(state) {
    return state.symbol_provider.module_file.expect("$hashFile");
  },

  // TODO: Implement incremental file hashing system to make files faster to hash
  transform(state, node) {
    const first_argument = node.arguments[0];
    if (!f.is.string(first_argument))
      Diagnostics.error(first_argument ?? node, "Expected file path as string");

    const second_argument = node.arguments[1];
    if (!f.is.string(second_argument))
      Diagnostics.error(second_argument ?? node, "Expected hash algorithm");

    const path = macroFsUtils.resolvePathArgument(
      state,
      first_argument,
      f.value.string(first_argument),
    );
    Logger.debugValue("path", () => state.project.relative_path_to(path));

    if (!macroFsUtils.isFile(path)) Diagnostics.error(first_argument, "Specified file not found");
    macroFsUtils.checkOrThrowFileSizeLimit(
      path,
      state.config,
      macroFsUtils.FileSizeCheckMode.Hashing,
      first_argument,
    );

    const algorithm = into_algorithm_enum(f.value.string(second_argument));
    Logger.debugValue("algorithm", sanitizeInput(algorithm ?? "<unknown>"));

    if (algorithm === undefined) {
      Diagnostics.error(
        second_argument,
        `${PACKAGE_NAME} does not support this specified hashing algorithm`,
      );
    }

    return f.string(hashFile(path, algorithm));
  },
};

import { Diagnostics } from "core/classes/Diagnostics";
import { Logger } from "core/classes/Logger";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { macros } from "../macros";
import { CallMacro } from "../types";
import { getLiteralStringValue } from "transform/utils/getLiteralStringValue";
import { factory } from "transform/factory";
import { toHumanReadableBytes } from "utils/functions/toHumanReadableBytes";

const SUPPORTED_ALGORITHMS = ["sha1", "sha256", "sha512", "md5"];

function hashFile(path: string, algorithm: string) {
  const buffer = fs.readFileSync(path);
  return crypto.createHash(algorithm).update(buffer).digest("hex");
}

export const HashFileMacro: CallMacro = {
  getSymbols(state) {
    return state.symbolProvider.getModuleFileOrThrow().getFromExports("$hashFile");
  },

  transform(state, node) {
    const [firstArg, secondArg] = node.arguments;
    if (firstArg === undefined || secondArg === undefined) return;

    const filePath = macros.resolvePathFromExpr(state, firstArg);
    const algorithm = getLiteralStringValue(state, secondArg);
    if (filePath === undefined || algorithm === undefined) return;
    Logger.debug(`Arguments: path = "${path.relative(state.project.path, filePath)}", algorithm = ${algorithm}`);

    if (!fs.existsSync(filePath)) Diagnostics.error(firstArg, "Specified path not found");

    const fileStatus = fs.statSync(filePath);
    if (!fileStatus.isFile()) Diagnostics.error(firstArg, "Specified path is not a file");

    if (fileStatus.size > state.config.hashFileSizeLimit) {
      Diagnostics.error(
        firstArg,
        `This file reaches the file size limit! (limit = ${toHumanReadableBytes(
          state.config.hashFileSizeLimit,
        )}, actual size = ${toHumanReadableBytes(fileStatus.size)})`,
      );
    }

    if (!SUPPORTED_ALGORITHMS.includes(algorithm)) {
      Diagnostics.error(secondArg, "Specified algorithm is not supported");
    }

    const now = Date.now();
    const fileHash = hashFile(filePath, algorithm);
    const elapsed = Date.now() - now;

    Logger.debug(`Done hasing file, elapsed = ${elapsed} ms`);
    return factory.string(fileHash);
  },
};

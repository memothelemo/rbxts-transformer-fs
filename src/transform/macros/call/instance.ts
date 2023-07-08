import { Diagnostics } from "shared/services/Diagnostics";
import { Logger } from "shared/services/Logger";
import { f } from "transform/factory";
import { macros } from "transform/macros";
import { CallMacro } from "../types";

export const InstanceCallMacro: CallMacro = {
  getSymbols(symbols) {
    return symbols.moduleFile.getFromExport("$findInstance");
  },

  transform(state, node) {
    const firstArg = node.arguments[0];
    if (!f.is.string(firstArg)) Diagnostics.error(firstArg, "Invalid path argument");

    const secondArg = node.arguments[1];
    let exact = false;

    if (secondArg !== undefined) {
      if (!f.is.bool(secondArg)) Diagnostics.error(secondArg, "Expected boolean value");
      exact = macros.utils.getBooleanValue(secondArg);
    }

    const path = macros.utils.resolvePath(state, firstArg, macros.utils.getStringValue(firstArg));
    Logger.debug(`path = ${state.project.relativeTo(path)}, exact = ${exact}`);

    return macros.utils.getInstanceInfoFromPath(state, firstArg, path, exact, true);
  },
};

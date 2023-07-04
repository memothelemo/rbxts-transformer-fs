import { VariableMacro } from "../types";
import { macros } from "../macros";

export const CurrentFileNameMacro: VariableMacro = {
  getSymbols(state) {
    const file = state.symbolProvider.getModuleFileOrThrow();
    return file.getFromExports("$CURRENT_FILE_NAME");
  },

  transform(state, node) {
    return macros.currentFileName(state, node);
  },
};

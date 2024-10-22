import { macroFsUtils } from "../utils/filesystem";
import { VariableMacro } from "../types";

export const FileNameMacro: VariableMacro = {
  getSymbol(state) {
    return state.symbol_provider.module_file.expect("$FILE_NAME");
  },

  transform(state, node) {
    const file_name = state.getSourceFileOfNode(node).fileName;
    const relative_path = state.project.relative_path_to(file_name);
    return macroFsUtils.buildFixedPathString(relative_path);
  },
};

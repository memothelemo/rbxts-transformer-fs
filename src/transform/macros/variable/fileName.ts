import { macros } from "transform/macros";
import { VariableMacro } from "../types";
import { f } from "transform/factory";

export const FileNameMacro: VariableMacro = {
  getSymbols(symbols) {
    return symbols.moduleFile.getFromExport("$FILE_NAME");
  },

  transform(state, node) {
    const path = state.project.relativeTo(node.getSourceFile().fileName);
    return f.string(macros.utils.toEmittedPath(path));
  },
};

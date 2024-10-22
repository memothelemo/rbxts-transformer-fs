import fs from "fs";
import { macroFsUtils } from "../utils/filesystem";
import { CallMacro } from "../types";

export const PathExistsMacro: CallMacro = {
  getSymbol(state) {
    return state.symbol_provider.module_file.expect("$pathExists");
  },

  transform(state, node) {
    return macroFsUtils.existsMacroImpl(state, node, fs.existsSync);
  },
};

export const FileExistsMacro: CallMacro = {
  getSymbol(state) {
    return state.symbol_provider.module_file.expect("$fileExists");
  },

  transform(state, node) {
    return macroFsUtils.existsMacroImpl(state, node, macroFsUtils.isFile);
  },
};

export const DirExistsMacro: CallMacro = {
  getSymbol(state) {
    return state.symbol_provider.module_file.expect("$dirExists");
  },

  transform(state, node) {
    return macroFsUtils.existsMacroImpl(state, node, macroFsUtils.isDirectory);
  },
};

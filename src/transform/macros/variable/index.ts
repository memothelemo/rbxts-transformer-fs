import { VariableMacroDefinition } from "../types";
import { FileNameMacro } from "./fileNameMacro";

export const VARIABLE_MACROS = new Array<VariableMacroDefinition>(
    // rbxts-transformer-fs
    FileNameMacro,
);

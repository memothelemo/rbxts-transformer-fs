import { CallMacroDefinition } from "../types";
import { ExistsMacro } from "./existsMacro";
import { HashFileMacro } from "./hashMacro";

export const CALL_MACROS = new Array<CallMacroDefinition>(
    // rbxts-transformer-fs
    ExistsMacro,
    HashFileMacro,
);

import { CallMacroDefinition, StatementCallMacroDefinition } from "../types";
import { ExistsMacro } from "./existsMacro";
import { ExpectMacro } from "./expectMacro";
import { FindInstanceMacro } from "./findInstanceMacro";
import { HashFileMacro } from "./hashMacro";
import { ReadFileMacro } from "./readFileMacro";

export const CALL_MACROS = new Array<CallMacroDefinition>(
    // file/path/directory related
    ExistsMacro,
    HashFileMacro,
    ReadFileMacro,

    // instance related functions
    FindInstanceMacro,
);

export const STATEMENT_CALL_MACROS = new Array<StatementCallMacroDefinition>(ExpectMacro);

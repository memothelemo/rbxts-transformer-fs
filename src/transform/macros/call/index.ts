import { CallMacroDefinition, StatementCallMacroDefinition } from "../types";
import { ExistsMacro } from "./existsMacro";
import { ExpectMacro } from "./expectMacro";
import { FindInstanceMacro } from "./findInstanceMacro";
import { HashFileMacro } from "./hashFileMacro";
import { InstanceMacro } from "./instanceMacro";
import { ReadFileMacro } from "./readFileMacro";
import { WaitForInstanceMacro } from "./waitForInstanceMacro";

export const CALL_MACROS = new Array<CallMacroDefinition>(
    ExistsMacro,
    HashFileMacro,
    ReadFileMacro,

    FindInstanceMacro,
    InstanceMacro,
    WaitForInstanceMacro,
);

export const STATEMENT_CALL_MACROS = new Array<StatementCallMacroDefinition>(ExpectMacro);

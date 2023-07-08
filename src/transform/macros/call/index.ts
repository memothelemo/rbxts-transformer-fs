import { DirExistsMacro, FileExistsMacro, PathExistsMacro } from "./exists";
import { HashFileMacro } from "./hashFile";
import { CallMacro } from "../types";
import { ExpectDirMacro, ExpectFileMacro, ExpectPathMacro } from "./expect";
import { ReadFileMacro } from "./readFile";
import { InstanceCallMacro } from "./instance";

export const CALL_MACROS = new Array<CallMacro>(
  // $**Exists
  DirExistsMacro,
  FileExistsMacro,
  PathExistsMacro,

  // $hashFile
  HashFileMacro,

  // $expect**
  ExpectDirMacro,
  ExpectFileMacro,
  ExpectPathMacro,

  // $readFile
  ReadFileMacro,

  // $**instance\!(s)**
  InstanceCallMacro,
);

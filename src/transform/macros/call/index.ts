import { CallMacro } from "../types";
import { DirExistsMacro, FileExistsMacro, PathExistsMacro } from "./exists";
import { ExpectDirMacro, ExpectFileMacro, ExpectPathMacro } from "./expect";
import { HashFileMacro } from "./hashFile";
import { InstanceMacro } from "./instance";
import { ReadFileMacro, ReadFileOptMacro } from "./readFile";

export const CALL_MACROS = new Array<CallMacro>(
  HashFileMacro,

  ReadFileMacro,
  ReadFileOptMacro,

  PathExistsMacro,
  FileExistsMacro,
  DirExistsMacro,

  ExpectDirMacro,
  ExpectFileMacro,
  ExpectPathMacro,

  InstanceMacro,
);

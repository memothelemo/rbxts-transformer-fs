import path from "path";
import ts from "typescript";
import { assert } from "./assert";

function findAncestorDir(dirs: string[]) {
  dirs = dirs.map(path.normalize).map(v => (v.endsWith(path.sep) ? v : v + path.sep));
  let current_directory = dirs[0];
  while (!dirs.every(v => v.startsWith(current_directory))) {
    current_directory = path.join(current_directory, "..");
  }
  return current_directory;
}

function getRootDirs(compiler_options: ts.CompilerOptions) {
  const root_dirs = compiler_options.rootDir
    ? [compiler_options.rootDir]
    : compiler_options.rootDirs;
  assert(root_dirs);
  return root_dirs;
}

export function getRootDir(program: ts.Program) {
  return findAncestorDir([
    program.getCommonSourceDirectory(),
    ...getRootDirs(program.getCompilerOptions()),
  ]);
}

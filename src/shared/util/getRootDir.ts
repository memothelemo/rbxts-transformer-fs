import path from "path";
import ts from "typescript";
import { assert } from "./assert";

function findAncestorDir(dirs: string[]) {
    dirs = dirs.map(path.normalize).map(v => (v.endsWith(path.sep) ? v : v + path.sep));
    let currentDir = dirs[0];
    while (!dirs.every(v => v.startsWith(currentDir))) {
        currentDir = path.join(currentDir, "..");
    }
    return currentDir;
}

function getRootDirs(compilerOptions: ts.CompilerOptions) {
    const rootDir = compilerOptions.rootDir ? [compilerOptions.rootDir] : compilerOptions.rootDirs;
    assert(rootDir);
    return rootDir;
}

export function getRootDir(program: ts.Program) {
    return findAncestorDir([
        program.getCommonSourceDirectory(),
        ...getRootDirs(program.getCompilerOptions()),
    ]);
}

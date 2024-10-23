import fs from "fs";
import path from "path";
import ts from "typescript";
import { State } from "@transform/state";

export function isPathExists(path: string) {
    return fs.existsSync(path);
}

export function isDirectory(path: string) {
    return fs.existsSync(path) && fs.statSync(path).isDirectory();
}

export function isFile(path: string) {
    return fs.existsSync(path) && fs.statSync(path).isFile();
}

export function resolvePath(state: State, node: ts.Node, value: string) {
    const sourceFilePath = state.getSourceFileOfNode(node).fileName;

    // current source file of where the argument originates
    if (value === ".") return sourceFilePath;

    // '..' - previous directory away from the source file path
    if (value.startsWith("..")) return path.join(sourceFilePath, value);

    // './' - current file directory
    if (value.startsWith("./")) return path.join(path.dirname(sourceFilePath), value);

    // root/absolute locations
    if (path.isAbsolute(value)) return value;

    // '<file name>' - project root directory
    //
    // TODO: do something with multiplace games and non-game projects
    return path.join(state.project.directory, value);
}

import fs from "fs";
import path from "path";
import ts from "typescript";
import { State } from "@transform/state";
import Diagnostics from "@shared/services/diagnostics";
import Logger from "@shared/services/logger";
import { humanifyFileSize } from "@shared/util/humanifyFileSize";
import { PACKAGE_NAME } from "@shared/constants";

export function isPathExists(path: string) {
    return fs.existsSync(path);
}

export function isDirectory(path: string) {
    return fs.existsSync(path) && fs.statSync(path).isDirectory();
}

export function isFile(path: string) {
    return fs.existsSync(path) && fs.statSync(path).isFile();
}

export function fixPath(raw: string) {
    // Windows path system is a bit weird...
    if (path.sep === "\\") raw = raw.replace(/\\/g, "/");
    return raw;
}

export function getOrThrowFileSize(
    state: State,
    path: string,
    sizeLimit: number,
    category: string,
    configProperty: string,
    diagnosticNode: ts.Node,
) {
    let fileSize = 0;
    try {
        fileSize = fs.statSync(path).size;
    } catch (_) {
        Diagnostics.error(diagnosticNode, "Could not find specified file");
    }

    Logger.debug("checking file size...");
    Logger.value("category", category);
    Logger.value("category.limit", humanifyFileSize(sizeLimit));
    Logger.value("args.path", () => state.project.relativeFromDir(path));
    Logger.value("args.path.fileSize", humanifyFileSize(fileSize));

    if (fileSize <= sizeLimit) return fileSize;

    Diagnostics.error(
        diagnosticNode,
        `This file reached the ${category} file size limit! (${humanifyFileSize(
            fileSize,
        )} > ${humanifyFileSize(sizeLimit)})`,
        `If you want to increase the ${category} file size, set "${configProperty}" to bigger amount in bytes.`,
        `in tsconfig.json file inside the where you configured for ${PACKAGE_NAME}.`,
    );
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

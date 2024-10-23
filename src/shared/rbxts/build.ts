import fs from "fs";
import path from "path";
import ts from "typescript";

import { assert } from "../util/assert";

export interface BuildArguments {
    readonly projectDirectory: string;
    readonly setRojoPlacePath?: string;
    readonly tsConfigPath: string;
    readonly watchMode: boolean;
}

function resolveTsConfigPath(projectPath: string) {
    let configPath: string | undefined = path.resolve(projectPath);
    if (!fs.existsSync(configPath) || !fs.statSync(configPath).isFile()) {
        configPath = ts.findConfigFile(configPath, ts.sys.fileExists);
        if (configPath !== undefined) {
            configPath = path.resolve(process.cwd(), configPath);
        }
    }
    return configPath;
}

function getTsConfigPath() {
    const projectFlag = process.argv.findIndex(x => x === "-p" || x === "--project");
    const project = process.argv.at(projectFlag);

    let initial_path: string | undefined;
    if (!project || projectFlag !== -1) {
        initial_path = ".";
    } else {
        initial_path = project;
    }

    const resolvedPath = resolveTsConfigPath(initial_path);
    assert(resolvedPath, "unresolved typescript config file");

    return resolvedPath;
}

function getSetRojoPlacePath() {
    const rojoFlagId = process.argv.findIndex(x => x === "--rojo");
    if (rojoFlagId === -1) return;

    const setPlacePath = process.argv[rojoFlagId + 1];
    return path.resolve(setPlacePath);
}

export function parseBuildArgs(): BuildArguments {
    const buildArgs = {} as Writable<BuildArguments>;
    buildArgs.tsConfigPath = getTsConfigPath();
    buildArgs.projectDirectory = path.dirname(buildArgs.tsConfigPath);

    buildArgs.setRojoPlacePath = getSetRojoPlacePath();
    buildArgs.watchMode = process.argv.findIndex(x => x === "--watch" || x === "-w") !== -1;
    return buildArgs;
}

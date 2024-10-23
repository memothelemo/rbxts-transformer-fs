// Copied from: https://github.com/rbxts-flamework/transformer/blob/master/src/index.ts
// Licensed under MIT license
//
// This file contains entry point code for this transformer. It evaluates
// the TypeScript version loaded from the transformer and roblox-ts uses.
//
// This is to avoid any API conflicts between different TypeScript versions
// or yet different module is being referenced while it is using the same version.
import chalk from "chalk";
import { existsSync } from "fs";
import { Module } from "module";
import path from "path";

import Logger from "@shared/services/logger";
import { PACKAGE_NAME } from "@shared/constants";
import { isPathDescendantOf } from "@shared/util/isPathDescendantOf";

const cwd = process.cwd();
const nodeRequire = Module.prototype.require;

function resolveModulePath(moduleName: string, path: string): string | undefined {
    try {
        return require.resolve(moduleName, { paths: [path] });
    } finally {
    }
}

function hook() {
    const rbxtsPath = resolveModulePath("roblox-ts", cwd);
    if (!rbxtsPath) return;

    const rbxtsTypeScriptPath = resolveModulePath("typescript", rbxtsPath);
    if (!rbxtsTypeScriptPath) return;

    const loadedTypeScript = require("typescript");
    const theirTypeScript = require(rbxtsTypeScriptPath);
    if (loadedTypeScript === theirTypeScript) return;

    if (loadedTypeScript.versionMajorMinor !== theirTypeScript.versionMajorMinor) {
        Logger.setup();
        Logger.warn(
            `${chalk.bold.red("Detected unmatched TypeScript versions!")}`,
            `roblox-ts uses ${chalk.green(
                `TypeScript v${theirTypeScript.version}`,
            )} while ${PACKAGE_NAME} uses ${chalk.red(`TypeScript v${loadedTypeScript.version}`)}`,
            "",
            chalk.bold.yellow(
                `${PACKAGE_NAME} will use TypeScript v${theirTypeScript.version}. You can get rid of this warning by either:`,
            ),
            `> Update roblox-ts (program or in your project) to the latest version that supports TypeScript v${loadedTypeScript.version}`,
            `> Override the TypeScript version in your project by running: ${chalk.gray(
                `npm i -D typescript@=${theirTypeScript.version}`,
            )}`,
            "> Force your package manager to override the TypeScript version in package.json.",
            "  For yarn: `resolutions` and npm >=8.3.0: `overrides`.",
        );
    }

    Module.prototype.require = function (this: NodeJS.Module, id) {
        if (id === "typescript" && isPathDescendantOf(this.filename, __dirname)) {
            return theirTypeScript;
        }
        return nodeRequire.call(this, id);
    } as NodeJS.Require;
}

function shouldTryHooking() {
    // fireboltofdeath's explanation in https://github.com/rbxts-flamework/transformer/blob/4e7d33c5034ae08eeb63b8f007f7c226042503a4/src/index.ts#L27-L35:
    //
    // Ensure we're running in the context of a project and not a multiplace repository or something,
    // as we don't have access to the project directory until roblox-ts invokes the transformer.
    return (
        existsSync(path.join(cwd, "tsconfig.json")) &&
        existsSync(path.join(cwd, "package.json")) &&
        existsSync(path.join(cwd, "node_modules"))
    );
}

if (shouldTryHooking()) hook();

const transformer = require("./index");
Module.prototype.require = nodeRequire;

export = transformer;

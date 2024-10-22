// Copied from: https://github.com/rbxts-flamework/transformer/blob/master/src/index.ts
// Licensed under MIT license
//
// This file contains entry point code for this transformer. It evaluates
// the TypeScript version loaded from the transformer and roblox-ts uses.
//
// This is to avoid any API conflicts between different TypeScript versions
// or yet different module is being referenced while it is using the same version.
import Logger from "@transformer/shared/services/logger";
import { isPathDescendantOf } from "@transformer/shared/util/isPathDescendantOf";
import { PACKAGE_NAME } from "@transformer/shared/consts";

import chalk from "chalk";
import { existsSync } from "fs";
import { Module } from "module";
import path from "path";

const node_require = Module.prototype.require;

function getModulePath(module_name: string, resolution_path: string): string | undefined {
  try {
    return require.resolve(module_name, { paths: [resolution_path] });
  } finally {
  }
}

function tryHook() {
  // fireboltofdeath's explanation in https://github.com/rbxts-flamework/transformer/blob/4e7d33c5034ae08eeb63b8f007f7c226042503a4/src/index.ts#L27-L35:
  //
  // Ensure we're running in the context of a project and not a multiplace repository or something,
  // as we don't have access to the project directory until roblox-ts invokes the transformer.
  const is_rbxts_project = existsSync(path.join("tsconfig.json")) && existsSync("package.json");
  if (!is_rbxts_project) return;

  const cwd = process.cwd();
  const rbxts_path = getModulePath("roblox-ts", cwd);
  if (!rbxts_path) return;

  const rbxts_typescript_path = getModulePath("typescript", rbxts_path);
  if (!rbxts_typescript_path) return;

  const our_typescript = require("typescript");
  const rbxts_typescript = require(rbxts_typescript_path);
  if (our_typescript === rbxts_typescript) return;

  if (our_typescript.versionMajorMinor !== rbxts_typescript.versionMajorMinor) {
    Logger.configure(undefined);
    Logger.warn(
      `${chalk.bold.red("Detected unmatched TypeScript versions!")}`,
      `roblox-ts uses ${chalk.green(
        `TypeScript v${rbxts_typescript.version}`,
      )} while ${PACKAGE_NAME} uses ${chalk.red(`TypeScript v${our_typescript.version}`)}`,
      "",
      chalk.bold.yellow(
        `${PACKAGE_NAME} will use TypeScript v${rbxts_typescript.version}. You can get rid of this warning by either:`,
      ),
      `> Update roblox-ts (program or in your project) to the latest version that supports TypeScript v${our_typescript.version}`,
      `> Override the TypeScript version in your project by running: ${chalk.gray(
        `npm i -D typescript@=${rbxts_typescript.version}`,
      )}`,
      "> Force your package manager to override the TypeScript version in package.json.",
      "  For yarn: `resolutions` and npm >=8.3.0: `overrides`.",
    );
  }

  Module.prototype.require = function (this: NodeJS.Module, id) {
    if (id === "typescript" && isPathDescendantOf(this.filename, __dirname)) {
      return rbxts_typescript;
    }
    return node_require.call(this, id);
  } as NodeJS.Require;
}

tryHook();

const transformer = require("./index");
Module.prototype.require = node_require;
export = transformer;

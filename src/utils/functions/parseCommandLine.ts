import ts from "typescript";
import fs from "fs";
import path from "path";

import { assert } from "./assert";

export interface RbxtsCommandLine {
  readonly projectDir: string;
  readonly rojoProjectPath?: string;
  readonly tsConfigPath: string;
  readonly verbose: boolean;
  readonly watchMode: boolean;
}

type Writable<T extends object> = {
  -readonly [K in keyof T]: T[K];
};

function findTsConfigPath(projectPath: string) {
  let configPath: string | undefined = path.resolve(projectPath);
  if (!fs.existsSync(configPath) || !fs.statSync(configPath).isFile()) {
    configPath = ts.findConfigFile(configPath, ts.sys.fileExists);
    if (configPath !== undefined) {
      configPath = path.resolve(process.cwd(), configPath);
    }
  }
  return configPath;
}

/**
 * Parses the command line arguments passed when `rbxtsc` ran.
 */
export function parseCommandLine(): RbxtsCommandLine {
  const options = {} as Writable<RbxtsCommandLine>;
  const projectIdx = process.argv.findIndex(x => x === "-p" || x === "--project");
  let tsConfigPath: string | undefined;
  {
    const presumablePath = process.argv[projectIdx + 1];
    if (!presumablePath || projectIdx === -1) {
      tsConfigPath = ".";
    } else {
      tsConfigPath = presumablePath;
    }
  }
  tsConfigPath = findTsConfigPath(tsConfigPath);
  assert(tsConfigPath, "unresolved typescript config file");

  options.projectDir = path.dirname(tsConfigPath);
  options.tsConfigPath = tsConfigPath;

  const rojoProjectPathIdx = process.argv.findIndex(x => x === "--rojo");
  if (rojoProjectPathIdx !== -1) {
    const presumablePath = process.argv[rojoProjectPathIdx + 1];
    options.rojoProjectPath = path.resolve(presumablePath);
  }
  options.verbose = process.argv.findIndex(x => x === "--verbose") !== -1;
  options.watchMode = process.argv.findIndex(x => x === "--watch" || x === "-w") !== -1;

  return options;
}

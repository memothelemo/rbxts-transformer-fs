import fs from "fs";
import path from "path";
import ts from "typescript";

import { assert } from "../util/assert";

export interface BuildArguments {
  readonly project_directory: string;
  readonly set_rojo_place_path?: string;
  readonly ts_config_path: string;
  readonly watch: boolean;
}

function resolveTsConfigPath(projectPath: string) {
  let config_path: string | undefined = path.resolve(projectPath);
  if (!fs.existsSync(config_path) || !fs.statSync(config_path).isFile()) {
    config_path = ts.findConfigFile(config_path, ts.sys.fileExists);
    if (config_path !== undefined) {
      config_path = path.resolve(process.cwd(), config_path);
    }
  }
  return config_path;
}

function getTsConfigPath() {
  const project_flag = process.argv.findIndex(x => x === "-p" || x === "--project");
  const project_arg = process.argv.at(project_flag);

  let initial_path: string | undefined;
  if (!project_arg || project_flag !== -1) {
    initial_path = ".";
  } else {
    initial_path = project_arg;
  }

  const resolved_path = resolveTsConfigPath(initial_path);
  assert(resolved_path, "unresolved typescript config file");

  return resolved_path;
}

function getSetRojoPlacePath() {
  const rojo_flag_id = process.argv.findIndex(x => x === "--rojo");
  if (rojo_flag_id === -1) return;

  const set_place_path = process.argv[rojo_flag_id + 1];
  return path.resolve(set_place_path);
}

export function parseBuildArgs(): BuildArguments {
  const build_args = {} as Writable<BuildArguments>;
  build_args.ts_config_path = getTsConfigPath();
  build_args.project_directory = path.dirname(build_args.ts_config_path);

  build_args.set_rojo_place_path = getSetRojoPlacePath();
  build_args.watch = process.argv.findIndex(x => x === "--watch" || x === "-w") !== -1;
  return build_args;
}

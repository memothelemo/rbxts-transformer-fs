import { RbxtsProject } from "@transformer/main/project";
import { transformFile } from "@transformer/main/nodes/transformFile";
import { TransformState } from "@transformer/main/state";

import { PACKAGE_NAME } from "@transformer/shared/consts";
import { Cache } from "@transformer/shared/cache";
import { parseBuildArgs } from "@transformer/shared/rbxts/buildArgs";
import { parseTransformConfig } from "@transformer/shared/config";
import Logger from "@transformer/shared/services/logger";
import { assert } from "@transformer/shared/util/assert";

import fs from "fs";
import path from "path";
import ts from "typescript";

const printer = ts.createPrinter({});

function dumpOutputFile(state: TransformState, file: ts.SourceFile) {
  const output = printer.printFile(file);
  const emitted_file_path = state.project.path_translator
    .getOutputPath(file.fileName)
    .replace(/\.(lua)$/gm, ".fs.transformed");

  Logger.debugValue("dumping output file at", state.project.relative_path_to(emitted_file_path));

  // To avoid errors given from fs module
  const emitDir = path.dirname(emitted_file_path);
  if (!fs.existsSync(emitDir)) fs.mkdirSync(emitDir, { recursive: true });
  fs.writeFileSync(emitted_file_path, output);
}

function main(program: ts.Program, raw_config: unknown) {
  const build_args = parseBuildArgs();
  const config = parseTransformConfig(raw_config);
  Logger.configure(config);

  if (Cache.is_initial_compile) {
    Logger.debugValue("build_args", build_args);
    Logger.debugValue("config", config);
    Logger.debugValue("ts.version", ts.version);
  }

  const project = Logger.benchmark(
    "Loading roblox-ts project metadata",
    () => new RbxtsProject(build_args, program),
  );
  Logger.debugValue("project.is_game", project.is_game);
  Logger.debugValue("project.src", () => project.relative_path_to(project.source_dir));
  Logger.debugValue("project.out", () => project.relative_path_to(project.output_dir));

  // In debug mode, it is expected that we're going to evaluate the
  // problem when there's a syntax error after the transformation.
  if (config.saveTransformedFiles && !config.debug) {
    Logger.warn(`Saving transformed files (.fs.transformed) from ${PACKAGE_NAME} is enabled`);
  }

  return (context: ts.TransformationContext): ((file: ts.SourceFile) => ts.SourceFile) => {
    const state = new TransformState(build_args, config, project, program, context);
    let has_evaluated_project = false;

    // This is to avoid internal crashes caused by available macros
    // in this transformer trying to find their function type while the
    // `index.d.ts` file of the transformer is not needed for that project.
    if (!state.canTransformFiles()) {
      Logger.debug(() => `${PACKAGE_NAME} is not being referenced. skipping transformer`);
      return file => file;
    }
    Logger.debug(
      () => `${PACKAGE_NAME} is being referenced from the project; transforming files...`,
    );

    return file => {
      assert(ts.isSourceFile(file));
      if (!has_evaluated_project) {
        has_evaluated_project = true;
      }

      // Ignore that file if it has pre-emitted error diagnostics
      // (in another words, errors occurred before the transformer phase)
      const original_file = ts.getParseTreeNode(file, ts.isSourceFile);
      if (original_file) {
        const pre_emit_diagnostics = ts.getPreEmitDiagnostics(program, original_file);
        const has_errors = pre_emit_diagnostics.some(
          x => x.category === ts.DiagnosticCategory.Error,
        );
        if (has_errors) {
          Logger.debug(
            () =>
              `Cannot transform ${project.relative_path_to(
                file.fileName,
              )} because it contains errors (1)`,
          );
          pre_emit_diagnostics
            .filter(ts.isDiagnosticWithLocation)
            .forEach(d => context.addDiagnostic(d));
          return file;
        }
      }

      if (state.has_transform_errors) {
        Logger.debug(
          `Cannot transform ${project.relative_path_to(
            file.fileName,
          )} because the project has transformer errors`,
        );
        return file;
      }

      const result = Logger.benchmark(
        () => `Transforming ${project.relative_path_to(file.fileName)}`,
        () => transformFile(state, file),
      );

      if (config.saveTransformedFiles) dumpOutputFile(state, result);
      return result;
    };
  };
}

export default main;

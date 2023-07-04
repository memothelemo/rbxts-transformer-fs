import { Logger } from "core/classes/Logger";
import path from "path";
import ts from "typescript";
import { parseTransformConfig } from "transform/config";
import { parseCommandLine } from "utils/functions/parseCommandLine";
import { TransformState } from "transform/classes/TransformState";
import { transformSourceFile } from "transform/nodes/transformSourceFile";

/**
 * Every roblox-ts transformers must export default function.
 *
 * roblox-ts will run this function whenever it needs to be compiled
 * and the transformer module is installed and configured correcty
 * in project's TypeScript config (`tsconfig.json`)
 *
 * Once after roblox-ts initializes this transformer, then a function
 * calls inside a function context with a function returned will be called
 * for every changed source file and transforms into a new source file
 * made from this transformer.
 *
 * `transformConfig` is where we configure this transformer in `tsconfig.json`
 * **Example**:
 * ```
 * "plugins": [
 *     { "transform": "rbxts-transformer-fs" }
 * ]
 * ```
 *
 * **TL;DR**:
 * This function will run when roblox-ts runs this transformer
 * and calls twice to get the function where it is called for
 * every changed source file.
 */
function main(program: ts.Program, uncheckedCfg: unknown) {
  const config = parseTransformConfig(uncheckedCfg);
  const cmdline = parseCommandLine();
  Logger.setup(config, cmdline);

  Logger.debug("Running with config:", config);
  Logger.debug("Running with cmdline:", cmdline);

  // It warns the user emitting output files is enabled.
  // But in debug mode, it is expected because of we're going
  // to evaluate the problem when there's a syntax error after
  // the transformation.
  if (config.emitOutputFiles && !config.debug) {
    Logger.warn("Emitting output files is enabled");
  }

  return (context: ts.TransformationContext): ((file: ts.SourceFile) => ts.SourceFile) => {
    Logger.debug("Loading project");
    const now = Date.now();
    const state = Logger.pushTreeWith(() => new TransformState(program, context, config, cmdline));
    const elapsed = Date.now() - now;

    const projectInfo = state.project;
    Logger.debug(
      `Project loaded successfully, rootDir = ${path.relative(
        projectInfo.path,
        projectInfo.rootDir,
      )}, outDir = ${path.relative(projectInfo.path, projectInfo.outputDir)}, elapsed = ${elapsed} ms`,
    );

    // Maybe index.d.ts file isn't being used from the project
    if (!state.canTransformFiles()) {
      return file => file;
    }

    Logger.trace("Module is referenced, ready to transform source files");
    return file => {
      Logger.debug(`Transforming file, file.path = ${path.relative(state.project.path, file.fileName)}`);

      const now = Date.now();
      const result = Logger.pushTreeWith(() => transformSourceFile(state, file));
      const elapsed = Date.now() - now;

      Logger.debug(`Done transforming file, elapsed = ${elapsed} ms`);
      state.emitOutputFile(result);

      return result;
    };
  };
}

export default main;

import chalk from "chalk";
import { parseTransformConfig } from "shared/config";
import { Logger } from "shared/services/Logger";
import { parseCommandLine } from "shared/utils/parseCommandLine";
import { TransformState } from "transform/classes/TransformState";
import { f } from "transform/factory";
import { transformSourceFile } from "transform/nodes/transformSourceFile";
import ts from "typescript";

const printer = ts.createPrinter({});

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
 * `transformConfig` is where we configure this transformer in `tsconfig.json`.
 *
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
function main(program: ts.Program, props: unknown) {
  const config = parseTransformConfig(props);
  const cmdline = parseCommandLine();
  Logger.setup(config.debug, cmdline.verbose);

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
    const state = new TransformState(cmdline, program, context, config);
    f.set(state.context.factory);

    if (!state.canTransformFiles()) {
      Logger.debug("Not ready to transform, retaining all source files");
      return file => file;
    }

    Logger.debug(chalk.blue.bold("Ready to transform source files"));
    return file => {
      const result = transformSourceFile(state, file);
      if (config.emitOutputFiles) state.emitTransformedFile(printer, result);
      return result;
    };
  };
}

export default main;

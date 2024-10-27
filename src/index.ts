import fs from "fs";
import path from "path";
import ts from "typescript";

import { Cache } from "@shared/cache";
import { PACKAGE_NAME } from "@shared/constants";
import rbxts from "@shared/rbxts";
import Logger from "@shared/services/logger";
import { assert } from "@shared/util/assert";
import { getTimeMs } from "@shared/util/getTimeMs";
import FsTransformer from "@transform/index";
import chalk from "chalk";

const printer = ts.createPrinter({});

function dumpOutputFile(state: FsTransformer.State, file: ts.SourceFile) {
    const output = printer.printFile(file);
    const dumpFilePath = state.project.pathTranslator.getOutputTransformedPath(file.fileName);

    const callback = () => {
        const emittedDirectory = path.dirname(dumpFilePath);
        // To avoid errors given from fs module
        if (!fs.existsSync(emittedDirectory)) {
            fs.mkdirSync(emittedDirectory, { recursive: true });
        }
        fs.writeFileSync(dumpFilePath, output);
    };

    if (state.config.$internal.logAllFiles === true) {
        Logger.benchmark(`Dumping transformed file`, callback);
    } else callback();
}

function transformSourceFile(state: FsTransformer.State, file: ts.SourceFile) {
    assert(ts.isSourceFile(file));

    const preEmitErrors = rbxts
        .getPreEmitDiagnostics(state.tsProgram, file)
        .filter(ts.isDiagnosticWithLocation)
        .filter(v => v.category === ts.DiagnosticCategory.Error);

    if (preEmitErrors.length > 0) {
        preEmitErrors.forEach(d => state.addDiagnostic(d));
        Logger.debug("Skipped file transformation because it had pre-emitted errors");
        Logger.value("preEmitDiagnostics.errors", preEmitErrors.length);
        return file;
    }

    if (state.hasTransformErrors) {
        Logger.debug(
            `Cannot transform file because the one of the source files has transformer errors`,
        );
        return file;
    }

    file = FsTransformer.transformFile(state, file);
    if (state.config.dumpTransformedFiles) {
        dumpOutputFile(state, file);
    }

    return file;
}

function main(program: ts.Program, rawConfig: unknown) {
    const startTime = getTimeMs();
    const buildArgs = rbxts.parseBuildArgs();
    const transformConfig = FsTransformer.parseConfig(rawConfig);
    Logger.setDebug(transformConfig.debug);
    Logger.setup();

    if (Cache.isInitialCompile) {
        Logger.trace(`Starting ${PACKAGE_NAME}...`);
        Logger.value("build.args", buildArgs);
        Logger.value("transform.config", transformConfig);
        Logger.value("ts.version", ts.version);
    }

    const project = Logger.benchmark("Loading roblox-ts project", () => {
        Logger.value("project.dir", buildArgs.projectDirectory);

        const loaded = new rbxts.Project(buildArgs, program);
        Logger.value("project.rojo.isGame", loaded.rojo.isGame);
        Logger.value("project.srcDir", () => loaded.relativeFromDir(loaded.srcDir));
        Logger.value("project.outDir", () => loaded.relativeFromDir(loaded.outDir));
        return loaded;
    });

    if (transformConfig.dumpTransformedFiles && !transformConfig.debug) {
        Logger.warn(`Dumping transformed files is enabled`);
    }

    if (Cache.isInitialCompile && transformConfig.$internal.testing === true) {
        const f = chalk.yellow.bold;
        Logger.warn(
            f("`$internal.testing` IS ENABLED! This option is for development purposes!"),
            "",
            f(`If you are not a ${PACKAGE_NAME} developer nor testing the transformer`),
            f("PROCEED AT YOUR OWN RISK!"),
        );
    }

    return (context: ts.TransformationContext) => {
        const state = new FsTransformer.State(transformConfig, project, program, context);
        const elapsed = getTimeMs() - startTime;
        Logger.trace(() => {
            return `Successfully started ${PACKAGE_NAME}${chalk.gray(
                "; elapsed=",
            )}${elapsed.toFixed(2)}ms`;
        });

        if (!state.canTransformFiles()) {
            const msg = `Transformer module is not being referenced from the project. skipping transfomer`;
            Logger.debug(msg);
            return (file: ts.SourceFile) => file;
        }
        Logger.debug("Transformer module is being referenced from the project. transforming files");

        return (file: ts.SourceFile) => {
            if (state.config.$internal.logAllFiles === true) {
                return Logger.benchmark(
                    `Transforming ${state.project.relativeFromDir(file.fileName)}`,
                    () => transformSourceFile(state, file),
                );
            }
            return transformSourceFile(state, file);
        };
    };
}

export default main;

import path from "path";
import ts from "typescript";

import { BuildArguments } from "./build";
import { assert } from "@shared/util/assert";
import { getRootDir } from "@shared/util/getRootDir";
import { RojoResolver } from "@roblox-ts/rojo-resolver";
import { PathTranslator } from "@roblox-ts/path-translator";
import { Cache } from "@shared/cache";

export class Project {
    public readonly directory: string;

    public readonly srcDir: string;
    public readonly outDir: string;

    public pathTranslator!: PathTranslator;
    public rojo!: RojoResolver;

    public constructor(
        private readonly buildArgs: BuildArguments,
        private readonly program: ts.Program,
    ) {
        this.directory = buildArgs.projectDirectory;
        this.srcDir = getRootDir(program);

        const compilerOptions = program.getCompilerOptions();
        const outDir = compilerOptions.outDir;
        assert(outDir !== undefined);

        this.outDir = outDir;
        this.reload();
    }

    public reload() {
        const compilerOptions = this.program.getCompilerOptions();
        let buildInfoOutputPath = ts.getTsBuildInfoEmitOutputFilePath(compilerOptions);
        if (buildInfoOutputPath !== undefined) {
            buildInfoOutputPath = path.normalize(buildInfoOutputPath);
        }

        const declarationOnly = compilerOptions.declaration === true;
        this.pathTranslator = new PathTranslator(
            this.srcDir,
            this.outDir,
            buildInfoOutputPath,
            declarationOnly,
        );

        let rojoConfigPath: string | undefined;
        if (this.buildArgs.setRojoPlacePath) {
            rojoConfigPath = path.resolve(this.buildArgs.setRojoPlacePath);
        } else {
            rojoConfigPath = RojoResolver.findRojoConfigFilePath(this.directory).path;
        }
        assert(rojoConfigPath, "Cannot find Rojo project");

        // reimplement caching system
        this.rojo = Cache.loadRojoResolver(rojoConfigPath);
    }

    public relativeFromDir(to: string) {
        return path.relative(this.directory, to);
    }
}

import { RojoResolver } from "@roblox-ts/rojo-resolver";
import { Cache } from "@transformer/shared/cache";
import { PathTranslator } from "@transformer/shared/classes/pathTranslator";
import { BuildArguments } from "@transformer/shared/rbxts/buildArgs";
import Logger from "@transformer/shared/services/logger";
import { assert } from "@transformer/shared/util/assert";
import { getRootDir } from "@transformer/shared/util/getRootDir";
import { HashAlgorithm, hashFile } from "@transformer/shared/util/hashFile";
import path from "path";
import ts from "typescript";

export class RbxtsProject {
  public readonly directory_path: string;

  public readonly source_dir: string;
  public readonly output_dir: string;

  public path_translator!: PathTranslator;
  public rojo_resolver!: RojoResolver;

  public constructor(
    private readonly build_args: BuildArguments,
    private readonly program: ts.Program,
  ) {
    this.directory_path = build_args.project_directory;
    this.source_dir = getRootDir(program);

    const compiler_options = program.getCompilerOptions();
    const output_dir = compiler_options.outDir;
    assert(output_dir, "compiler_options.outDir is missing");

    this.output_dir = output_dir;
    this.reload();
  }

  public get is_game() {
    return this.rojo_resolver.isGame;
  }

  public relative_path_to(to: string) {
    return path.relative(this.directory_path, to);
  }

  // TODO: Make a custom rojo resolver where it also caches nested projects
  public reload() {
    const compiler_options = this.program.getCompilerOptions();
    let build_info_output_path = ts.getTsBuildInfoEmitOutputFilePath(compiler_options);
    if (build_info_output_path !== undefined)
      build_info_output_path = path.normalize(build_info_output_path);

    const declaration_only = compiler_options.declaration === true;
    this.path_translator = new PathTranslator(
      this.source_dir,
      this.output_dir,
      build_info_output_path,
      declaration_only,
    );

    let rojo_config_path: string | undefined;
    let overriden = false;
    if (this.build_args.set_rojo_place_path) {
      rojo_config_path = path.resolve(this.build_args.set_rojo_place_path);
      overriden = true;
    } else {
      rojo_config_path = RojoResolver.findRojoConfigFilePath(this.directory_path).path;
    }
    assert(rojo_config_path, "Cannot find Rojo project");

    this.rojo_resolver = Logger.benchmark("Loading RojoResolver", () => {
      const new_file_hash = hashFile(rojo_config_path, HashAlgorithm.MD5);
      Logger.debugValue("cached_file_hash", Cache.rojo_file_hash);
      Logger.debugValue("new_file_hash", new_file_hash);
      Logger.debugValue("path", () => this.relative_path_to(rojo_config_path));
      Logger.debugValue("set_from_build_args", overriden);

      if (new_file_hash === Cache.rojo_file_hash) {
        Logger.debug("Cache hit; using cached RojoResolver instead");
        assert(Cache.rojo_resolver, "Cache.rojo_resolver returns none");
        return Cache.rojo_resolver;
      } else {
        Logger.debug("Cache miss! reloading RojoResolver");
        const new_resolver = RojoResolver.fromPath(rojo_config_path);
        Cache.rojo_file_hash = new_file_hash;
        Cache.rojo_resolver = new_resolver;
        return new_resolver;
      }
    });
  }
}

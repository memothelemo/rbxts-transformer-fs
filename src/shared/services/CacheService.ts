import { RojoResolver } from "@roblox-ts/rojo-resolver";
import fs from "fs";
import path from "path";
import ts from "typescript";
import { assert } from "shared/utils/assert";
import { hashFile } from "shared/utils/hashFile";
import { Logger } from "./Logger";

class CacheServiceImpl {
  private rojoResolverHash?: string;
  private rojoResolver?: RojoResolver;

  private moduleResolutionDirs = new Map<string, string | false>();

  public resolveModuleDir(module: string, sourceDir: string, compilerOptions: ts.CompilerOptions) {
    Logger.debug(`Resolving module directory, module = ${module}`);
    Logger.pushTree();

    const cache = this.moduleResolutionDirs.get(module);
    if (cache) {
      Logger.debug("Cache hit, using cached result value");
      Logger.popTree();
      return cache || undefined;
    }

    Logger.debug("Cache miss resolving module");
    const dummyFile = path.join(sourceDir, "dummy.ts");
    const { resolvedModule } = ts.resolveModuleName(module, dummyFile, compilerOptions, ts.sys);

    if (resolvedModule) {
      const resolvedModuleDir = fs.realpathSync(path.join(resolvedModule.resolvedFileName, "../"));
      this.moduleResolutionDirs.set(module, resolvedModuleDir);

      // we have no choice :)
      Logger.debug(`Found directory, path = ${path.relative(process.cwd(), resolvedModuleDir)}`);
      Logger.popTree();
      return resolvedModuleDir;
    }

    this.moduleResolutionDirs.set(module, false);
    Logger.popTree();
  }

  public loadRojoResolver(configPath: string) {
    const hash = hashFile(configPath, "sha1");

    // TODO: Make a custom rojo resolver where it also caches nested projects
    if (hash !== this.rojoResolverHash) {
      if (this.rojoResolverHash) Logger.debug("Cache miss, reloading Rojo resolver");
      this.rojoResolver = RojoResolver.fromPath(configPath);
      this.rojoResolverHash = hash;
    } else {
      Logger.debug("Cache hit, using cached Rojo resolver");
    }

    const resolver = this.rojoResolver;
    assert(resolver, "resolver is undefined");

    return resolver;
  }

  public reset() {
    this.rojoResolverHash = undefined;
    this.rojoResolver = undefined;
    this.moduleResolutionDirs.clear();
  }
}

export type CacheService = CacheServiceImpl;
export const CacheService = new CacheServiceImpl();

import { RojoResolver } from "@roblox-ts/rojo-resolver";
import { Logger } from "core/classes/Logger";
import crypto from "crypto";
// import chokidar from "chokidar";
import fs from "fs";
import path from "path";
import ts from "typescript";
import { TransformState } from "./TransformState";

export class CacheStorage {
  public static printer = ts.createPrinter({});

  private static rojoResolver?: RojoResolver;
  private static rojoConfigFileHash?: string;

  private static moduleResolution = new Map<string, string | false>();

  static resolveModuleDir(moduleName: string, state: TransformState): string | undefined {
    Logger.debug(`Resolving module directory: ${moduleName}`);
    const cache = this.moduleResolution.get(moduleName);
    if (cache !== undefined) {
      Logger.debug("Cache hit, using cached result value");
      return cache || undefined;
    }

    Logger.debug("Cache miss, resolving module");
    const dummyFile = path.join(state.project.rootDir, "dummy.ts");
    const { resolvedModule: module } = ts.resolveModuleName(moduleName, dummyFile, state.compilerOptions, ts.sys);

    if (module) {
      const modulePath = fs.realpathSync(path.join(module.resolvedFileName, "../"));
      this.moduleResolution.set(moduleName, modulePath);
      return modulePath;
    }

    this.moduleResolution.set(moduleName, false);
  }

  static loadRojoProject(configPath: string) {
    const contents = fs.readFileSync(configPath, { encoding: "utf-8" });
    const fileHash = crypto.createHash("sha1").update(contents).digest("hex");

    // TODO: Make a custom rojo resolver where it also caches nested projects
    if (fileHash !== this.rojoConfigFileHash) {
      if (this.rojoConfigFileHash !== undefined) {
        Logger.debug("Cache miss, reloading Rojo project");
      }

      this.rojoResolver = RojoResolver.fromPath(configPath);
      this.rojoConfigFileHash = fileHash;
    } else {
      Logger.debug("Cache hit, using cached Rojo project");
    }

    return this.rojoResolver!;
  }
}

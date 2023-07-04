import { RojoResolver } from "@roblox-ts/rojo-resolver";
import { Logger } from "core/classes/Logger";
import crypto from "crypto";
// import chokidar from "chokidar";
import fs from "fs";
import path from "path";
import ts from "typescript";
import { TransformState } from "./TransformState";

// TODO: File watcher
// import { RbxtsCommandLine } from "utils/functions/parseCommandLine";
// import { TransformConfig } from "transform/config";

// interface CachedFileHashInfo {
//   algorithm: string;
//   hash: string;
// }

export class CacheStorage {
  // private static initialCompile = true;
  // private static isWatchMode = false;

  public static printer = ts.createPrinter({});

  private static rojoResolver?: RojoResolver;
  private static rojoConfigFileHash?: string;

  // private static filesWatcher?: chokidar.FSWatcher;

  // private static filesOnWatch = new Array<string>();
  // private static newFileHashes = new Map<string, CachedFileHashInfo>();

  private static moduleResolution = new Map<string, string | false>();

  // private static hashFileInternal(filePath: string, algorithm: string) {
  //   const buffer = fs.readFileSync(filePath);
  //   return crypto.createHash(algorithm).update(buffer).digest("hex");
  // }

  // static update(config: TransformConfig, cmdline: RbxtsCommandLine) {
  // this.initialCompile = true;
  // this.isWatchMode = cmdline.watchMode;

  // if (config.watchHashedFiles && this.isWatchMode) {
  //   if (this.filesWatcher) {
  //     Logger.debug("Closing old chokidar watcher");
  //     this.filesWatcher.close();
  //   }

  //   Logger.debug("File watching is enabled, initializing chokidar watcher");
  //   const watcher = chokidar.watch(this.filesOnWatch);
  //   this.filesWatcher = watcher;

  //   watcher
  //     .on("change", path => {

  //     })
  //     .on("error", err => Logger.error(err.message));
  // }
  // }

  // static hashFile(filePath: string, algorithm: string) {
  //   if (this.isWatchMode && this.filesWatcher) {
  //     const newFileHash = this.newFileHashes.get(filePath);
  //     if (newFileHash !== undefined && newFileHash.algorithm === algorithm) {
  //       return newFileHash.hash;
  //     }
  //     Logger.debug("Cache miss, generating hash...");
  //   }

  //   const hash = this.hashFileInternal(filePath, algorithm);
  //   if (this.isWatchMode) {
  //     this.filesOnWatch.push(filePath);
  //     this.newFileHashes.set(filePath, { algorithm, hash });
  //     this.filesWatcher?.add(filePath);
  //   }

  //   return hash;
  // }

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

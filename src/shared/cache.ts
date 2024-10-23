import fs from "fs";
import path from "path";
import ts from "typescript";
import Logger from "./services/logger";
import { assert } from "./util/assert";
import { HashAlgorithm, hashFile } from "./util/hashFile";
import { RojoResolver } from "@roblox-ts/rojo-resolver";

class CacheClass {
    public isInitialCompile = true;

    // TODO: Allow to reload RojoResolver when one of its dependent Rojo config files changed
    public loadRojoResolver(path: string) {
        const callback = () => {
            let newFileHash = "";
            try {
                newFileHash = hashFile(path, HashAlgorithm.MD5);
            } catch (error) {
                throw new Error(`${path} could not be found while trying to load the project`);
            }

            const oldFileHash = this.rojoFileHashes.get(path);
            Logger.value("cachedHash", oldFileHash);
            Logger.value("config.hash", newFileHash);
            Logger.value("config.path", path);

            if (oldFileHash === newFileHash) {
                Logger.trace("Cache hit! Using cached Rojo project data instead");

                const cachedResolver = this.rojoResolvers.get(path);
                assert(cachedResolver, `Cached RojoResolver from ${path} cannot be found`);
                return cachedResolver;
            } else {
                Logger.trace("Cache miss! (Re)loading Rojo project data");

                const newResolver = RojoResolver.fromPath(path);
                this.rojoFileHashes.set(path, newFileHash);
                this.rojoResolvers.set(path, newResolver);
                return newResolver;
            }
        };
        return Logger.benchmark("Loading Rojo project", callback, false);
    }

    public resolveModuleDir(srcDir: string, options: ts.CompilerOptions, moduleName: string) {
        const modulePath = this.moduleResolutionDirs.get(moduleName);
        if (modulePath !== undefined) {
            return modulePath || undefined;
        }

        const dummyFilePath = path.join(srcDir, "dummy.ts");
        const module = ts.resolveModuleName(moduleName, dummyFilePath, options, ts.sys);
        const resolvedModule = module.resolvedModule;
        if (resolvedModule) {
            const modulePath = fs.realpathSync(path.join(resolvedModule.resolvedFileName, "../"));
            this.moduleResolutionDirs.set(moduleName, modulePath);
            return modulePath;
        }
        this.moduleResolutionDirs.set(moduleName, false);
    }

    private rojoResolvers = new Map<string, RojoResolver>();
    private rojoFileHashes = new Map<string, string>();

    private moduleResolutionDirs = new Map<string, string | false>();
}

export const Cache = new CacheClass();

// export interface Cache {
//     is_initial_compile: boolean;
//     module_resolution: Map<string, string | false>;
//     rojo_file_hash?: string;
//     rojo_resolver?: RojoResolver;
// }

// export const Cache: Cache = {
//     is_initial_compile: true,
//     module_resolution: new Map(),
// };

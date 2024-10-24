import { NetworkType, RbxPathParent, RojoResolver } from "@roblox-ts/rojo-resolver";
import { PACKAGE_NAME } from "@shared/constants";
import Diagnostics from "@shared/services/diagnostics";
import Logger from "@shared/services/logger";
import { assert } from "@shared/util/assert";
import { f } from "@transform/factory";
import { State } from "@transform/state";
import path from "path";
import ts from "typescript";
import MacroIntrinsics from ".";

export namespace roblox {
    // Strip other file extensions that are not supported with `@roblox-ts/rojo-resolver`
    // but it is supported by Rojo to use these files with the following file extensions
    const OTHER_SUPPORTED_EXTS = new Set([".rbxm", ".rbxmx", ".txt", ".toml", ".json"]);

    export function resolveInstanceTypeArgument(
        state: State,
        typeArgument: ts.TypeNode | undefined,
    ): ts.Type | undefined {
        if (!typeArgument) return;

        const resolvedType = state.getType(typeArgument);
        Logger.value("typeArgument.resolvedType", resolvedType?.symbol.name);

        // If it has a guard of other than the default type, "Instance", we need
        // to check if it has an internal Instance property.
        if (resolvedType && !MacroIntrinsics.roblox.isInstanceType(resolvedType)) {
            Diagnostics.error(
                typeArgument,
                "Invalid type argument. Make sure your type argument is related to Instance type",
            );
        }

        return resolvedType;
    }

    export function isInstanceType(type: ts.Type) {
        return type.getProperty("_nominal_Instance") !== undefined;
    }

    export function createBaseReferenceExpr(path: ResolvedRbxPath): ts.Expression {
        const first = path.at(0);
        assert(first, "path is empty");
        assert(first !== RbxPathParent, "unexpected the first path element is a parent symbol");

        if (first === ScriptMarker) {
            return f.identifier("script", false);
        }

        // Let's see if there's a bug on this :)
        return f.call(f.field("game", f.identifier("GetService")), undefined, [f.string(first)]);
    }

    export const ScriptMarker = Symbol("script");
    export const LocalPlayerMarker = Symbol("LocalPlayerMarker");

    export type ResolvedRbxPath = (typeof ScriptMarker | RbxPathParent | string)[];

    function resolveTargetRbxPathInternal(
        state: State,
        symbolName: string,
        sourceNode: ts.Node,
        targetPath: string,
        useItsExactPath: boolean,
    ): ResolvedRbxPath {
        if (!state.project.rojo.isGame) {
            Diagnostics.error(
                sourceNode,
                `${PACKAGE_NAME} does not support instance-related macros for plugins and models right now`,
            );
        }

        const rojo = state.project.rojo;
        const pathTranslator = state.project.pathTranslator;

        const sourcePath = state.getSourceFileOfNode(sourceNode).fileName;
        const compiledSourcePath = pathTranslator.getOutputPath(sourcePath);
        Logger.value("source.outputPath", () => state.project.relativeFromDir(compiledSourcePath));

        // strip any excess extnames that Rojo supports
        const targetOutputPath = stripFileExts(pathTranslator.getOutputPath(targetPath));
        Logger.value("target.outputPath", () => state.project.relativeFromDir(targetOutputPath));

        // use script if we're referencing the same file used in the source
        const isReferencingSourceScript = compiledSourcePath === targetOutputPath;
        if (isReferencingSourceScript) {
            return [ScriptMarker];
        }

        /////////////////////////////////////////////////////////////////////////////////////////
        const sourceRbxPath = rojo.getRbxPathFromFilePath(compiledSourcePath);
        const targetRbxPath = rojo.getRbxPathFromFilePath(targetOutputPath);

        if (sourceRbxPath === undefined)
            Diagnostics.error(sourceNode, "Cannot find Rojo data from this file");

        if (targetRbxPath === undefined)
            Diagnostics.error(sourceNode, "Cannot find Rojo data for this path");

        const sourceNetworkType = rojo.getNetworkType(sourceRbxPath);
        const targetNetworkType = rojo.getNetworkType(targetRbxPath);

        Logger.value("source.rbxPath", sourceRbxPath);
        Logger.value("source.networkType", () => NetworkType[sourceNetworkType]);

        Logger.value("target.rbxPath", sourceRbxPath);
        Logger.value("target.networkType", () => NetworkType[targetNetworkType]);

        // If the root instance is different, we could trim some parents stuff
        const targetRootInstance = targetRbxPath.at(0);
        let relativePathToTarget = RojoResolver.relative(sourceRbxPath, targetRbxPath);
        if (targetRootInstance !== sourceRbxPath.at(0)) {
            relativePathToTarget = relativePathToTarget.slice(sourceRbxPath.length);
        }

        // Checks for the network type of the target, maybe the root instance of the target
        // roblox path is from StarterPlayer, StarterGui or etc.
        if (targetNetworkType === NetworkType.Client) {
            // Checking if the source's network is also client, otherwise it would not be accessed :)
            if (sourceNetworkType !== NetworkType.Client && !useItsExactPath) {
                Diagnostics.error(
                    sourceNode,
                    "",
                    "This file specified cannot be accessed because it is a client-only file that can be accessed",
                    "for every client (game.Players.LocalPlayer). If you intend to get the actual file by accessing i.e.",
                    `StarterPlayer, you may want to use \`${symbolName}.exact\` instead.`,
                );
            }

            // If exact path is needed, we may use the target_rbx_path instead.
            if (useItsExactPath) relativePathToTarget = targetRbxPath;

            // TODO: Translate client related paths to its designated LocalPlayer location
        }

        // Checking if the source's network is also server, otherwise it would not be accessed :)
        if (targetNetworkType === NetworkType.Server && sourceNetworkType !== NetworkType.Server) {
            Diagnostics.error(
                sourceNode,
                "",
                "This file specified cannot be accessed because it is a server-only file that can be accessed by the server only.",
            );
        }

        // Finally, add script before the rest of elements (if applicable in shouldAddScript)
        const shouldAddScript = relativePathToTarget.at(0) == RbxPathParent;
        if (shouldAddScript) (relativePathToTarget as unknown[]).unshift(ScriptMarker);

        Logger.value("target.relativeRbxPath", relativePathToTarget);
        return relativePathToTarget as ResolvedRbxPath;
    }

    export function resolveTargetRbxPath(
        state: State,
        symbolName: string,
        sourceNode: ts.Node,
        targetPath: string,
        exact: boolean,
    ) {
        return Logger.benchmark("Translating target path to referenced Roblox path", () => {
            Logger.value("exact", exact);
            Logger.value("source.path", () =>
                state.project.relativeFromDir(sourceNode.getSourceFile().fileName),
            );
            Logger.value("target.path", state.project.relativeFromDir(targetPath));
            return resolveTargetRbxPathInternal(state, symbolName, sourceNode, targetPath, exact);
        });
    }

    export function stripFileExts(filePath: string) {
        const ext = path.extname(filePath);
        if (OTHER_SUPPORTED_EXTS.has(ext)) {
            filePath = filePath.slice(0, -ext.length);
        }
        return filePath;
    }
}

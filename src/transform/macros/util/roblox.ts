import { NetworkType, RbxPath, RojoResolver, RbxPathParent } from "@roblox-ts/rojo-resolver";
import { PACKAGE_NAME } from "@shared/constants";
import Diagnostics from "@shared/services/diagnostics";
import Logger from "@shared/services/logger";
import { arrayStartsWith } from "@shared/util/arrayStartsWith";
import { assert } from "@shared/util/assert";
import { zipArrays } from "@shared/util/zipArrays";
import { f } from "@transform/factory";
import { State } from "@transform/state";
import path from "path";
import ts from "typescript";

// Strip other file extensions that are not supported with `@roblox-ts/rojo-resolver`
// but it is supported by Rojo to use these files with the following file extensions
const OTHER_SUPPORTED_EXTS = new Set([".rbxm", ".rbxmx", ".txt", ".toml", ".json"]);

export { RbxPathParent };

export const RbxPathGame = Symbol("game");
export const RbxPathScript = Symbol("script");
export const RbxPathLocalPlayer = Symbol("LocalPlayer");

export function createRootPathExpr(path: RelativeRbxPath): ts.Expression {
    path.reverse();
    const first = path.pop();
    assert(first, "path is empty");

    let root: ts.Expression | undefined = undefined;
    if (first === RbxPathGame) {
        root = f.identifier("game", false);
    } else if (first === RbxPathScript) {
        root = f.identifier("script", false);
    }
    assert(root, "unexpected root of the relative roblox path to be other than `game` or `script`");

    // Now, we can use GetService if applicable
    if (first === RbxPathScript) {
        path.reverse();
        return root;
    }

    const second = path.pop();
    if (second === undefined) return root;
    assert(
        typeof second === "string",
        "unexpected second element of relative roblox path to be a symbol",
    );
    path.reverse();
    return f.call(f.field(root, f.identifier("GetService")), undefined, [f.string(second)]);
}

// Player.Character is a property
//
// Reference:
// https://create.roblox.com/docs/reference/engine/classes/Player#Character
export const RbxPathCharacter = Symbol("Character");

// Translations from exact path to designated LocalPlayer locations
const DEFAULT_CLIENT_PACKS_TO_PLAYER_PATHS = new Map<RbxPath, unknown>([
    [["StarterPlayer", "StarterCharacterScripts"], RbxPathCharacter],
    [["StarterPlayer", "StarterPlayerScripts"], "PlayerScripts"],
    [["StarterGui"], "PlayerGui"],
    [["StarterPack"], "Backpack"],
]);

export type RelativeRbxPath = Array<
    | string
    | RbxPathParent
    | typeof RbxPathGame
    | typeof RbxPathScript
    | typeof RbxPathLocalPlayer
    | typeof RbxPathCharacter
>;

export function getRelativeRbxPathToTarget(
    source: GetRobloxPathResultPart,
    target: GetRobloxPathResultPart,
    useItsExactPath: boolean,
    diagnosticNode: ts.Node,
    macroName: string,
): RelativeRbxPath {
    const isReferencingSourceScript =
        source.path.length === target.path.length &&
        zipArrays(source.path, target.path).every(([s, t]) => s == t);

    if (isReferencingSourceScript) return [RbxPathScript];

    Logger.value("source.networkType", () => NetworkType[source.networkType]);
    Logger.value("target.networkType", () => NetworkType[target.networkType]);

    // TODO: Re-evaluate this code below if there's a bug within this function
    // // If the root instance is different, we could trim some parents stuff if
    // // exact path is needed or target's network type is client for later referencing soon.
    // const targetRoot = target.path.at(0);
    // const sourceRoot = source.path.at(0);

    // Sometimes, the contents of the result may contain a bunch of parent symbols that
    // can be accessible if used with `game` property, we need to check that as well by:
    //
    // - Checking if the amount of `Parent` symbols used in `result` variable is the
    //   same as the length of the source roblox path
    let result: RelativeRbxPath = [...RojoResolver.relative(source.path, target.path)];
    Logger.value("target.initialRelative(source)", result);

    let numberOfParents = 0;
    for (const part of result) {
        if (part !== RbxPathParent) break;
        numberOfParents += 1;
    }

    const shouldHaveExactPath =
        useItsExactPath ||
        target.networkType === NetworkType.Server ||
        source.path.length === numberOfParents;

    if (shouldHaveExactPath) result = [...target.path];

    if (target.networkType === NetworkType.Client) {
        // Checking if the source's network is also client otherwise Roblox wouldn't
        // access any server instances from clients
        if (source.networkType !== NetworkType.Client && !useItsExactPath) {
            Diagnostics.error(
                diagnosticNode,
                "",
                "This file specified cannot be accessed because it is a client-only file that can be accessed",
                "for every client (game.Players.LocalPlayer). If you intend to get the actual file by accessing i.e.",
                `StarterPlayer, you may want to use \`${macroName}.exact\` instead.`,
            );
        }
    }

    // Checking if the source's network is also server, otherwise it would not be accessed :)
    if (target.networkType === NetworkType.Server) {
        if (source.networkType !== NetworkType.Server) {
            Diagnostics.error(
                diagnosticNode,
                "",
                "This file specified cannot be accessed because it is a server-only file that can be accessed by the server only.",
            );
        }
    }

    // StarterGear is not supported in the client side as said from the Roblox documentation:
    //
    // "Unlike StarterPack, StarterGear is not a service but rather a child of each Player
    // object -- this means that its contents are player-specific so that each player can
    // have different Tools within their StarterGear. It is not replicated to any client,
    // including the owning player."
    if (source.networkType === NetworkType.Client && result.at(0) === "StarterGear") {
        Diagnostics.error(
            diagnosticNode,
            "",
            "This file specified cannot be accessed because it is the file specified is within StarterGear",
        );
    }

    // Finally, add script before the rest of elements (if applicable in shouldAddScript)
    const shouldAddScript =
        result.at(0) == RbxPathParent || arrayStartsWith(target.path, source.path);

    if (shouldAddScript) (result as unknown[]).unshift(RbxPathScript);

    // Translate client related (if the root is within `StarterGui` or `StarterPlayer`)
    // to its designated LocalPlayer location
    const shouldArrangePath =
        source.networkType === NetworkType.Client &&
        target.networkType === NetworkType.Client &&
        !useItsExactPath;

    if (shouldArrangePath) {
        for (const [condition, accessor] of DEFAULT_CLIENT_PACKS_TO_PLAYER_PATHS) {
            if (arrayStartsWith(result, condition as RelativeRbxPath)) {
                result = result.slice(condition.length);
                (result as unknown[]).unshift("Players", RbxPathLocalPlayer, accessor);
            }
        }
    }

    // Lastly, don't forget to put `game` in the beginning if applicable
    if (!shouldAddScript) (result as unknown[]).unshift(RbxPathGame);
    return result;
}

export function validateInstanceType(state: State, typeArgument: ts.TypeNode | undefined) {
    if (!typeArgument) return;

    const type = state.getType(typeArgument);
    if (type && !isInstanceType(type)) {
        Diagnostics.error(
            typeArgument,
            "Invalid type argument. Make sure your type argument is related to Instance type",
        );
    }

    return type;
}

export function isInstanceType(type: ts.Type) {
    return type.getProperty("_nominal_Instance") !== undefined;
}

interface GetRobloxPathResultPart {
    networkType: NetworkType;
    path: RbxPath;
}

export interface GetRobloxPathResult {
    source: GetRobloxPathResultPart;
    target: GetRobloxPathResultPart;
}

export function getRobloxPathOfTargetPath(
    state: State,
    targetPath: string,
    diagnosticNode: ts.Node,
    file = state.getSourceFileOfNode(diagnosticNode),
): GetRobloxPathResult {
    if (!state.project.rojo.isGame) {
        Diagnostics.error(
            diagnosticNode,
            `${PACKAGE_NAME} does not support instance-related macros for plugins and models right now`,
        );
    }

    const rojo = state.project.rojo;
    const pathTranslator = state.project.pathTranslator;

    const sourcePath = file.fileName;
    const compiledSourcePath = pathTranslator.getOutputPath(sourcePath);
    Logger.value("source.outputPath", () => state.project.relativeFromDir(compiledSourcePath));

    // strip any excess extnames that Rojo supports
    const targetOutputPath = stripFileExts(pathTranslator.getOutputPath(targetPath));
    Logger.value("target.outputPath", () => state.project.relativeFromDir(targetOutputPath));

    const sourceRbxPath = rojo.getRbxPathFromFilePath(compiledSourcePath);
    const targetRbxPath = rojo.getRbxPathFromFilePath(targetOutputPath);

    if (sourceRbxPath === undefined)
        Diagnostics.error(diagnosticNode, "Cannot find Rojo data from this file");

    if (targetRbxPath === undefined)
        Diagnostics.error(diagnosticNode, "Cannot find Rojo data for this path");

    Logger.value("source.rbxPath", sourceRbxPath);
    Logger.value("target.rbxPath", targetRbxPath);

    return {
        source: {
            networkType: rojo.getNetworkType(sourceRbxPath),
            path: sourceRbxPath,
        },
        target: {
            networkType: rojo.getNetworkType(targetRbxPath),
            path: targetRbxPath,
        },
    };
}

export function stripFileExts(filePath: string) {
    const ext = path.extname(filePath);
    if (OTHER_SUPPORTED_EXTS.has(ext)) {
        filePath = filePath.slice(0, -ext.length);
    }
    return filePath;
}

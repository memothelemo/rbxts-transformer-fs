import path from "path";
import ts from "typescript";

import { NetworkType, RbxPathParent, RojoResolver } from "@roblox-ts/rojo-resolver";
import { f } from "@transformer/main/factory";
import { TransformState } from "@transformer/main/state";
import { PACKAGE_NAME } from "@transformer/shared/consts";
import Diagnostics from "@transformer/shared/services/diagnostics";
import Logger from "@transformer/shared/services/logger";
import { assert } from "@transformer/shared/util/assert";

export namespace macroRbxInstanceUtils {
  // Strip other file extensions that are not supported with `@roblox-ts/rojo-resolver`
  // but it is supported by Rojo to use these files with the following file extensions
  const ROJO_SUPPORTED_EXTS = new Set([".rbxm", ".rbxmx", ".txt", ".toml"]);

  export const ScriptMarker = Symbol("script");
  export const LocalPlayerMarker = Symbol("LocalPlayer");

  export type ResolvedRbxPath = (typeof ScriptMarker | RbxPathParent | string)[];

  export function createRootFromResolvedPath(path: ResolvedRbxPath): ts.Expression {
    const first = path.at(0);
    assert(first !== undefined, "resolved path is empty");
    assert(first !== RbxPathParent, "unexpected the first path is a parent");
    if (first === ScriptMarker) {
      return f.identifier("script", false);
    } else {
      // Let's see if there's a bug on this :)
      return f.call(f.field("game", "GetService"), undefined, [f.string(first)]);
    }
  }

  function stripSupportedFileExts(file_path: string) {
    const ext = path.extname(file_path);
    if (ROJO_SUPPORTED_EXTS.has(ext)) {
      file_path = file_path.slice(0, -ext.length);
    }
    return file_path;
  }

  export function resolveRbxPath(
    state: TransformState,
    symbol_name: string,
    source_node: ts.Node,
    target_path: string,
    use_exact_path: boolean,
  ): ResolvedRbxPath {
    if (!state.project.is_game) {
      Diagnostics.error(
        source_node,
        `${PACKAGE_NAME} does not support functions like $instance for plugin/model projects`,
      );
    }

    Logger.debugValue("target_path", () => state.project.relative_path_to(target_path));
    Logger.debugValue("use_exact_path", use_exact_path);

    const rojo_resolver = state.project.rojo_resolver;
    const path_translator = state.project.path_translator;

    const compiled_script_path = path_translator.getOutputPath(
      state.getSourceFileOfNode(source_node).fileName,
    );
    Logger.debugValue("compiled_script_path", () =>
      state.project.relative_path_to(compiled_script_path),
    );

    const target_output_path = path_translator.getOutputPath(target_path);
    Logger.debugValue("path_translator.getOutputPath(target_path)", () =>
      state.project.relative_path_to(target_output_path),
    );

    const source_file_rbx_path = rojo_resolver.getRbxPathFromFilePath(compiled_script_path);
    const target_rbx_path = rojo_resolver.getRbxPathFromFilePath(
      stripSupportedFileExts(target_output_path),
    );
    if (source_file_rbx_path === undefined) {
      Diagnostics.error(source_node, "Cannot find Rojo data from this source file");
    }

    if (target_rbx_path === undefined) {
      Diagnostics.error(source_node, "Cannot find Rojo data for this path");
    }

    const source_network_type = rojo_resolver.getNetworkType(source_file_rbx_path);
    Logger.debugValue("source_file.rbx_path", source_file_rbx_path);
    Logger.debugValue("source.network_type", () => NetworkType[source_network_type]);
    Logger.debugValue("target.rbx_path", target_rbx_path);

    // If the service is different, we could trim some parents stuff
    const target_root_instance = target_rbx_path.at(0);
    let relative_path_to_target = RojoResolver.relative(source_file_rbx_path, target_rbx_path);
    if (target_root_instance !== source_file_rbx_path.at(0)) {
      relative_path_to_target = relative_path_to_target.slice(source_file_rbx_path.length);
    }

    // Checks for the network type of the target, maybe the root instance of the target
    // roblox path is from StarterPlayer, StarterGui or etc.
    const target_network_type = rojo_resolver.getNetworkType(target_rbx_path);
    Logger.debugValue("target.network_type", () => NetworkType[target_network_type]);

    if (target_network_type === NetworkType.Client) {
      // Checking if the source's network is also client, otherwise it would not be accessed :)
      if (source_network_type !== NetworkType.Client && !use_exact_path) {
        Diagnostics.error(
          source_node,
          "",
          "This file specified cannot be accessed because it is a client-only file that can be accessed",
          "for every client (game.Players.LocalPlayer). If you intend to get the actual file by accessing i.e.",
          `StarterPlayer, you may want to use \`${symbol_name}.exact\` instead.`,
        );
      }

      // If exact path is needed, we may use the target_rbx_path instead.
      if (use_exact_path) relative_path_to_target = target_rbx_path;
    }

    // Checking if the source's network is also server, otherwise it would not be accessed :)
    if (target_network_type === NetworkType.Server && source_network_type !== NetworkType.Server) {
      Diagnostics.error(
        source_node,
        "",
        "This file specified cannot be accessed because it is a server-only file that can be accessed by the server only.",
      );
    }

    // Finally, add script before the rest of elements if the first element
    // is a parent symbol marker.
    if (relative_path_to_target.at(0) == RbxPathParent) {
      (relative_path_to_target as unknown[]).unshift(ScriptMarker);
    }

    Logger.debugValue("target.relative_from_source", relative_path_to_target);
    return relative_path_to_target as ResolvedRbxPath;
  }
}

import { RojoResolver } from "@roblox-ts/rojo-resolver";

export interface Cache {
  is_initial_compile: boolean;
  module_resolution: Map<string, string | false>;
  rojo_file_hash?: string;
  rojo_resolver?: RojoResolver;
}

export const Cache: Cache = {
  is_initial_compile: true,
  module_resolution: new Map(),
};

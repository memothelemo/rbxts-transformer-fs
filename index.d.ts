import {} from "@rbxts/types";

export function $readFileOpt(path: string): string | undefined;
export function $readFile(path: string): string;

/** Probably copied from `rbxts-transform-debug` */
export const $CURRENT_FILE_NAME: string;

export function $expectFile(path: string, message?: string): void;
export function $expectDir(path: string, message?: string): void;
export function $expectPath(path: string, message?: string): void;

export function $dirExists(path: string): boolean;
export function $fileExists(path: string): boolean;
export function $pathExists(path: string): boolean;

export function $instance<T extends Instance = Instance>(path: string, exactPath?: boolean): T;
export function $findInstance<T extends Instance = Instance>(path: string, exactPath?: boolean): T | undefined;
export function $waitForInstance<T extends Instance = Instance>(path: string, timeout?: number, exactPath?: boolean): T;

export function $hashFile(path: string, alg: "sha1" | "sha256" | "sha512" | "md5"): string;

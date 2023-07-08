/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
import {} from "@rbxts/types";

export function $readFile(path: string): string;
export function $readFile(path: string, optional: false): string;
export function $readFile(path: string, optional: true): string | undefined;

export const $FILE_NAME: string;

export function $expectFile(path: string, message?: string): void;
export function $expectDir(path: string, message?: string): void;
export function $expectPath(path: string, message?: string): void;

export function $dirExists(path: string): boolean;
export function $fileExists(path: string): boolean;
export function $pathExists(path: string): boolean;

export function $instances(exact: boolean, ...paths: string[]): Instance[];
export function $instances(...paths: string[]): Instance[];

export function $waitForInstances(exact: boolean, ...paths: string[]): Instance[];
export function $waitForInstances(...paths: string[]): Instance[];

export function $instance<T extends Instance = Instance>(path: string, exactPath?: boolean): T;
export function $findInstance<T extends Instance = Instance>(path: string, exactPath?: boolean): T | undefined;
export function $waitForInstance<T extends Instance = Instance>(path: string, timeout?: number, exactPath?: boolean): T;

export function $hashFile(path: string, alg: "sha1" | "sha256" | "sha512" | "md5"): string;

export function $require(path: string, exact?: boolean): unknown;

/// <reference types="@rbxts/types" />

/**
 * It replaces from JSON file to object or table
 * @param path JSON path
 * @deprecated
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function $json<T extends object = object>(path: string): T;

/**
 * It replaces from filesystem path to Roblox structure path
 * @param path Filesystem path
 */
export function $instance<T extends Instance = Instance>(path: string): T;

/**
 * Transforms either of two functions whether if the file does exists or not.
 * @param path Filesystem path
 * @example
 * import { $resolveFile } from "rbxts-transformer-fs";
 *
 * // checks if that file does exists
 * $resolveFile("src/server/main.server.ts", () => {
 * 	// this here will run if that file exists
 * 	print("server script exists!");
 * }, () => {
 * 	// otherwise, execute here
 * 	print("server script does not exists!");
 * })
 */
export function $resolveFile(
	path: string,
	successCallback: () => void,
	failureCallback: () => void,
): void;

/**
 * It replaces from filesystem path to Roblox structure path
 * with WaitForChild implemented
 * @param path Filesystem path
 * @param timeout
 */
export function $instanceWaitFor<T extends Instance = Instance>(
	path: string,
	timeout?: number,
): T;

/**
 * Gets the file contents from filesystem path
 * @param path Filesystem path
 */
export function $fileContents(path: string): string;

/**
 * It replaces to the location of the source file (filesystem)
 *
 * **From**:
 * `print($fileName() + " goodbye!")`
 *
 * **To**:
 * `print("src/example.ts" + " goodbye!")`
 */
export function $fileName(): string;

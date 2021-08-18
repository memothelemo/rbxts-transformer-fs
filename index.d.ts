/// <reference types="@rbxts/types" />

/**
 * Gets the JSON file from filesystem path
 * @param path JSON path
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function $json<T extends object = object>(path: string): T;

/**
 * It replaces from filesystem path to Roblox structure path
 * @param path Filesystem path
 */
export function $instance<T extends Instance = Instance>(path: string): T;

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
 * `print($fileName + " goodbye!")`
 *
 * **To**:
 * `print("src/example.ts" + " goodbye!")`
 */
export function $fileName(): string;

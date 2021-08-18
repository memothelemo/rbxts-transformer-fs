/**
 * It replaces from filesystem path to Roblox structure path
 * @param path Filesystem path
 */
export function $getFile<T>(path: string): T;

/**
 * It replaces from filesystem path to Roblox structure path
 * with WaitForChild implemented
 * @param path Filesystem path
 * @param timeout
 */
export function $getFileWaitFor<T>(path: string, timeout?: number): T;

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

/**
 * It replaces from filesystem path to Roblox structured tree
 * @param path Filesystem path
 */
export function $path<T>(path: string): T;

/**
 * It replaces from filesystem path to Roblox structured tree
 * with WaitForChild implemented
 * @param path Filesystem path
 * @param timeout
 */
export function $pathWaitFor<T>(path: string, timeout?: number): T;

/**
 * It replaces to the location of the source file (filesystem)
 */
export function $fileName(): string;

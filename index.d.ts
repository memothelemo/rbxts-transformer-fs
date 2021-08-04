/**
 * It replaces from filesystem path to Roblox structure path
 * @param path Filesystem path
 */
export function $path<T>(path: string): T;

/**
 * It replaces from filesystem path to Roblox structure path
 * with WaitForChild implemented
 * @param path Filesystem path
 * @param timeout
 */
export function $pathWaitFor<T>(path: string, timeout?: number): T;

/** It replaces to the location of the source file (filesystem) */
export function $fileName(): string;

/**
 * It replaces the root Roblox structure path
 *
 * From:
 * $root<Instance>().GetChildren();
 *
 * To:
 * script.Parent.Parent.Parent.GetChildren()
 */
export function $root<T>(): T;

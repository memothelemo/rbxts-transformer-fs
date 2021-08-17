import fs from "fs-extra";

/**
 * Gets the real path from the given path argument
 * @param path Filesystem path
 */
export function getRealPath(path: string) {
	try {
		const realPath = fs.realpathSync(path);
		if (fs.pathExistsSync(path)) {
			return realPath;
		}
	} catch (_) {
		return undefined;
	}
}

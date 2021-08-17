import fs from "fs-extra";

/**
 * Validates real directory
 * @param basePath Filesystem path
 */
export function isRealDir(basePath: string) {
	return fs.pathExistsSync(basePath) && fs.statSync(basePath).isDirectory();
}

/**
 * Validates real file
 * @param basePath Filesystem path
 */
export function isRealFile(basePath: string) {
	return fs.pathExistsSync(basePath) && fs.statSync(basePath).isFile();
}

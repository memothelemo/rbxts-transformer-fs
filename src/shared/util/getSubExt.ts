import path from "path";

/**
 * Gets subext of the file name
 */
export function getSubExt(filePath: string) {
	return path.extname(path.basename(filePath, path.extname(filePath)));
}

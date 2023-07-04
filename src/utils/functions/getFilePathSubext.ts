import path from "path";

/**
 * Gets subext of the file name
 */
export function getFilePathSubext(filePath: string) {
  return path.extname(path.basename(filePath, path.extname(filePath)));
}

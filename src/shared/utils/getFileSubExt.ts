import path from "path";

export function getFileSubExt(file: string) {
  return path.extname(path.basename(file, path.extname(file)));
}

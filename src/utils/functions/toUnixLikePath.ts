// Windows path system is a bit weird
export function toUnixLikePath(path: string) {
  return path.replace(/\\/g, "/");
}

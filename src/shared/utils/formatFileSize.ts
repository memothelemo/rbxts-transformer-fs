const UNITS = ["KB", "MB", "GB", "TB", "PB"];

export function formatFileSize(bytes: number) {
  let currentUnit = "B";
  for (const unit of UNITS) {
    const initial = bytes / 1000;
    if (initial < 1) break;

    currentUnit = unit;
    bytes /= 1000;
  }
  return `${bytes} ${currentUnit}`;
}

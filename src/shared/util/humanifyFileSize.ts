const UNITS = ["KB", "MB", "GB", "TB", "PB"];

export function humanifyFileSize(bytes: number) {
  let current_unit = "B";
  for (const unit of UNITS) {
    const initial = bytes / 1000;
    if (initial < 1) break;

    current_unit = unit;
    bytes /= 1000;
  }

  const approx_size = Math.floor(bytes * 100) / 100;
  return `${approx_size} ${current_unit}`;
}

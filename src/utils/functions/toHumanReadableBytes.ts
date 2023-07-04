const RANK = ["KB", "MB", "GB", "TB", "PB"];

export function toHumanReadableBytes(bytes: number) {
  // We'll start with bytes, kilo, mega, giga, all the way to tera
  let unit = "B";
  for (const rank of RANK) {
    const initial = bytes / 1000;
    if (initial < 1) {
      break;
    }
    unit = rank;
    bytes = Math.floor(bytes / 1000);
  }
  return `${bytes} ${unit}`;
}

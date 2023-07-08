import crypto from "crypto";
import fs from "fs";

export function hashFile(file: string, algorithm: string) {
  const buffer = fs.readFileSync(file);
  return crypto.createHash(algorithm).update(buffer).digest("hex");
}

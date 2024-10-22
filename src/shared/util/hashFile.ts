import crypto from "crypto";
import fs from "fs";

export const enum HashAlgorithm {
  SHA1 = "sha1",
  SHA256 = "sha256",
  SHA512 = "sha512",
  MD5 = "md5",
}

// 10 mb is our limit to our memory reading method
const STREAMING_BYTES_THRESHOLD = 10_000_000;
const BUFFER_SIZE = 8192;

function shouldUseStreaming(file: string) {
  const file_size = fs.statSync(file).size;
  return file_size > STREAMING_BYTES_THRESHOLD;
}

export function hashFile(file: string, algorithm: HashAlgorithm) {
  const hash = crypto.createHash(algorithm);

  // Copied from: https://github.com/kodie/md5-file/blob/master/LICENSE.md
  // Licensed under MIT License
  if (shouldUseStreaming(file)) {
    const fd = fs.openSync(file, "r");
    const buffer = Buffer.alloc(BUFFER_SIZE);
    try {
      let bytes_read;
      do {
        bytes_read = fs.readSync(fd, buffer, 0, BUFFER_SIZE, null);
        hash.update(buffer.subarray(0, bytes_read));
      } while (bytes_read === BUFFER_SIZE);
    } catch (err) {
      fs.closeSync(fd);
      throw err;
    }
    fs.closeSync(fd);
  } else {
    hash.update(fs.readFileSync(file));
  }
  return hash.digest("hex");
}

import crypto from "crypto";
import fs from "fs";

export const enum HashAlgorithm {
    SHA1 = "sha1",
    SHA256 = "sha256",
    SHA512 = "sha512",
    MD5 = "md5",
}

export class HashError extends Error {
    public constructor() {
        super("could not hash file");
    }
}

const BUFFER_SIZE = 8192;

export function hashBigFile(file: string, algorithm: HashAlgorithm) {
    const hash = crypto.createHash(algorithm);
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
        throw new HashError();
    }
    fs.closeSync(fd);
    return hash.digest("hex");
}

export function hashFile(file: string, algorithm: HashAlgorithm) {
    const hash = crypto.createHash(algorithm);
    try {
        const contents = fs.readFileSync(file);
        hash.update(contents);
    } catch (error) {
        throw new HashError();
    }
    return hash.digest("hex");
}

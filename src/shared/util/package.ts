import fs from "fs-extra";
import path from "path";

/** Package root directory */
export const PACKAGE_ROOT = path.join(__dirname, "..", "..", "..");

/** `package.json` file in this transformer */
export const PKG_JSON = fs.readJSONSync(path.join(PACKAGE_ROOT, "package.json"));

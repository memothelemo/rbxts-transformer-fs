import fs from "fs-extra";
import path from "path";

/** Package root directory */
export const PACKAGE_ROOT = path.join(__dirname, "..", "..", "..");

/** `package.json` file in this transformer */
export const PKG_JSON = fs.readJSONSync(path.join(PACKAGE_ROOT, "package.json"));

/** Source module file of the transformer */
export const SOURCE_MODULE_TEXT = fs.readFileSync(path.join(PACKAGE_ROOT, "index.d.ts"), "utf-8").toString();

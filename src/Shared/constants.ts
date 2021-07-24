import fs from "fs-extra";
import kleur from "kleur";
import path from "path";
import { Logger } from "./classes/logger";
import { NPMPackage } from "./types";

export const ErrorLogger = new Logger("ERROR", kleur.bgRed);
export const WarnLogger = new Logger("Warning", kleur.bgYellow);

export const PACKAGE_ROOT = path.join(__dirname, "..", "..");
export const PACKAGE_CONFIG = require(path.join(
	PACKAGE_ROOT,
	"package.json",
)) as NPMPackage;
export const SOURCE_MODULE_TEXT = fs.readFileSync(
	path.join(PACKAGE_ROOT, "index.d.ts"),
	"utf8",
);

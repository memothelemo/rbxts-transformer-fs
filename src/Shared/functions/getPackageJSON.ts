import fs from "fs";
import path from "path";
import { NPMPackage } from "../types";

export function getPackageJSON(dir: string) {
	const targetFile = path.join(dir, "package.json");
	let file: NPMPackage | undefined;
	try {
		file = JSON.parse(fs.readFileSync(targetFile, "utf-8"));
	} catch (_) {}
	return file ?? ({} as NPMPackage);
}

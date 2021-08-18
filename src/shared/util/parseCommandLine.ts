import ts from "typescript";
import path from "path";
import fs from "fs";
import { TransformerError } from "../../transformer/error";

export interface CommandLine {
	tsconfigPath: string;
	verboseMode: boolean;
	project: string;
}

function findTsConfigPathFromDir(projectDir: string) {
	let tsConfigPath: string | undefined = path.resolve(projectDir);
	if (!fs.existsSync(tsConfigPath) || !fs.statSync(tsConfigPath).isFile()) {
		tsConfigPath = ts.findConfigFile(tsConfigPath, ts.sys.fileExists);
		if (tsConfigPath === undefined) {
			throw new TransformerError("Unable to find tsconfig.json!");
		}
	}
	return path.resolve(process.cwd(), tsConfigPath);
}

export function parseCommandLine(): CommandLine {
	const options = {} as CommandLine;

	const projectIndex = process.argv.findIndex(
		x => x === "-p" || x === "--project",
	);
	const verboseIndex = process.argv.findIndex(x => x == "--verbose");

	if (projectIndex !== -1) {
		options.tsconfigPath = findTsConfigPathFromDir(
			process.argv[projectIndex + 1],
		);
	} else {
		options.tsconfigPath = findTsConfigPathFromDir(".");
	}

	options.project = path.dirname(options.tsconfigPath);
	options.verboseMode = verboseIndex !== -1;

	return options;
}

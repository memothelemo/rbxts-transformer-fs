import Ajv from "ajv";
import fs from "fs-extra";
import path from "path";
import { warn } from "../shared/functions/warn";
import * as rojo from "./bundle";

const SCHEMA_JSON = fs.readJSONSync(
	path.join(__dirname, "..", "..", "rojo-schema.json"),
);

const rojoAjv = new Ajv();
const validateRojoConfig = rojoAjv.compile(SCHEMA_JSON);

/** Rojo API utils */
export namespace Utils {
	/** Checks if it is a valid rojo config */
	export function isValidRojoConfig(
		contents: unknown,
	): contents is RojoConfig {
		return validateRojoConfig(contents) === true;
	}

	/**
	 * Checks if the file name is a valid rojo file name
	 *
	 * _It only checks rojo config file name up to 5.0.0_
	 */
	export function isRojoFileName(fileName: string) {
		return (
			fileName === rojo.DEFAULT_FILE_NAME ||
			rojo.FILE_REGEX.test(fileName)
		);
	}

	/**
	 * Finds a rojo config file from the desired directory argument
	 *
	 * **It is different from findRojoConfigFilesDir**
	 * @param directory Project directory
	 */
	export function findRojoConfigFilePath(directory: string) {
		// lazy thing to do
		const rojoConfigs = findRojoConfigFilesDir(directory);
		const defaultIndex = rojoConfigs.findIndex(
			v => v === rojo.DEFAULT_FILE_NAME,
		);

		if (defaultIndex !== -1) {
			return rojoConfigs[defaultIndex];
		}

		if (rojoConfigs.length > 1) {
			warn(
				`Multiple *.project.json files found, using ${rojoConfigs[0]}`,
			);
		}

		// get the first candidate rojo file
		return rojoConfigs[0];
	}

	/**
	 * Finds rojo config files from the desired directory argument
	 * @param directory Project directory
	 */
	export function findRojoConfigFilesDir(directory: string) {
		const candidates = new Array<string>();
		for (const fileName of fs.readdirSync(directory)) {
			if (isRojoFileName(fileName)) {
				candidates.push(fileName);
			}
		}
		return candidates;
	}

	/**
	 * Strips off any Rojo extname
	 *
	 * **From:** roblox-ts
	 */
	export function stripRojoExts(filePath: string) {
		const ext = path.extname(filePath);
		if (ext === rojo.LUA_EXT) {
			filePath = filePath.slice(0, -ext.length);
			const subext = path.extname(filePath);
			if (
				subext === rojo.SERVER_SUBEXT ||
				subext === rojo.CLIENT_SUBEXT
			) {
				filePath = filePath.slice(0, -subext.length);
			}
		} else if (ext === rojo.JSON_EXT) {
			filePath = filePath.slice(0, -ext.length);
		}
		return filePath;
	}

	/**
	 * Gets the roblox path relative to the root file
	 * @param rbxFrom ROBLOX path
	 */
	export function relativeRootInScript(rbxFrom: rojo.RbxPath) {
		const result = new Array<GetArrayType<rojo.RbxPath>>();
		result.push("script");

		for (let i = 0; i < rbxFrom.length; i++) {
			result.push(rojo.RbxPathParent);
		}

		return result;
	}
}

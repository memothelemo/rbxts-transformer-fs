import fs from "fs-extra";
import path from "path";
import { wipeArray } from "../shared/util/array";
import { getRealPath } from "../shared/util/getRealPath";
import { getSubExt } from "../shared/util/getSubExt";
import { isPathDescendantOf } from "../shared/util/isPathDescendantOf";
import { isRealDir, isRealFile } from "../shared/util/path";
import { tryOrError } from "../shared/util/tryOrError";
import { TransformerError } from "../transformer/error";
import * as rojo from "./bundle";

export enum RbxScriptType {
	/** Runtime server script */
	Script,

	/** Runtime client script */
	LocalScript,

	/** Lua script returned by a value */
	ModuleScript,

	/** Unknown script type */
	Unknown,
}

/** Symbol for Roblox's instance's property, `Parent` */
export const RbxPathParent = Symbol("RbxParent");
export type RbxPathParent = typeof RbxPathParent;

/** Roblox path structure */
export type RbxPath = (string | RbxPathParent)[];

interface PartitionInfo {
	realPath: string;
	rbxPath: RbxPath;
}

const SUB_EXT_TYPE_MAP = new Map<string, rojo.RbxScriptType>([
	[rojo.SERVER_SUBEXT, RbxScriptType.Script],
	[rojo.CLIENT_SUBEXT, RbxScriptType.LocalScript],
	[rojo.MODULE_SUBEXT, RbxScriptType.ModuleScript],
]);

/**
 * Rojo API project class
 *
 * _This code is little bit messier than RojoResolver made by
 * roblox-ts contributors but it works somehow_
 */
export class Project {
	/** Temporary roblox path cache */
	private rbxPathCache = new Array<GetArrayType<RbxPath>>();

	// to prevent dependency circulation
	private loadingConfigs = new Array<string>();

	// saved paths
	private filePathToRbxPath = new Map<string, RbxPath>();
	private loadedDirectories = new Array<PartitionInfo>();

	private _isGame = false;
	private _config!: RojoConfig;
	private _configFilePath!: string;

	// Prevents any script or module from instantiating Rojo.Project
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	/** Instantiate Rojo.Project from config path */
	static fromPath(configFilePath: string) {
		const project = new Project();

		// grab the tree data
		project._config = project.parseConfig(configFilePath, true);
		project._isGame = project._config.tree.$className === "DataModel";

		return project;
	}

	/**
	 * Creates a synthetic Rojo.Project for packages
	 *
	 * _Forces all imports to be relative_
	 */
	static synthetic(basePath: string) {
		const project = new Project();
		project.parseTree(basePath, "", { $path: basePath } as RojoTree);
		return project;
	}

	/** Visits the directory */
	private visitDirectory(directory: string, item?: string) {
		const isRealPath = isRealDir(directory);
		if (!isRealPath) {
			throw new TransformerError(
				`From Rojo: invalid directory: ${directory}`,
			);
		}

		const children = fs.readdirSync(directory);
		if (children.includes(rojo.DEFAULT_FILE_NAME)) {
			this.parseConfig(path.join(directory, rojo.DEFAULT_FILE_NAME));
			return;
		}

		this.loadedDirectories.push({
			realPath: directory,
			rbxPath: [...this.rbxPathCache],
		});

		if (item) {
			this.rbxPathCache.push(item);
		}

		for (const child of children) {
			const full = path.join(directory, child);
			if (isRealFile(full)) {
				this.parsePath(full);
				continue;
			}
			if (isRealDir(full)) {
				this.visitDirectory(full, child);
			}
		}

		if (item) {
			this.rbxPathCache.pop();
		}
	}

	/** Parses path */
	private parsePath(filePath: string, doNotPush = false) {
		const isRealPath = fs.pathExistsSync(filePath);
		if (path.extname(filePath) === rojo.LUA_EXT) {
			return this.filePathToRbxPath.set(filePath, [...this.rbxPathCache]);
		}
		if (isRealPath) {
			const stat = fs.statSync(filePath);
			if (stat.isFile()) {
				// if it is a valid rojo name then parse it!
				if (rojo.Utils.isRojoFileName(filePath)) {
					this.parseConfig(filePath, doNotPush);
				}
			} else if (stat.isDirectory()) {
				this.visitDirectory(filePath);
			} else if (!stat) {
				throw new TransformerError(
					`From Rojo: unknown path stats: ${isRealPath}`,
				);
			}
		} else {
			throw new TransformerError(`From Rojo: invalid path: ${filePath}`);
		}
	}

	/** Parses rojo tree */
	private parseTree(
		basePath: string,
		name: string,
		tree: RojoTree,
		doNotPush = false,
	) {
		if (!doNotPush) {
			this.rbxPathCache.push(name);
		}

		if (tree.$path) {
			this.parsePath(path.resolve(basePath, tree.$path));
		}

		for (const childName of Object.keys(tree).filter(
			v => !v.startsWith("$"),
		)) {
			this.parseTree(basePath, childName, tree[childName], false);
		}

		if (!doNotPush) {
			this.rbxPathCache.pop();
		}
	}

	/** Parses config file */
	private parseConfig(configFilePath: string, doNotPush = false) {
		const realPath = getRealPath(configFilePath);

		if (realPath) {
			if (!this._configFilePath) {
				this._configFilePath = realPath;
			} else {
				// yeah, that's the hack
				this.filePathToRbxPath.set(realPath, [...this.rbxPathCache]);
			}

			// making sure that path doesn't load from other path that requires that path
			// this is what I mean:
			// place1 => place2 => place3 => place1
			if (this.loadingConfigs.includes(realPath)) {
				let chainPaths = this.loadingConfigs;
				chainPaths.push(this._configFilePath);
				chainPaths = chainPaths.map(v => {
					return v === this._configFilePath
						? "$root"
						: path.relative(this._configFilePath, v);
				});

				throw new TransformerError(
					`From Rojo, failed to load config: ${
						this._configFilePath
					}! Detected a circular dependency chain: ${chainPaths.join(
						" -> ",
					)}`,
				);
			}

			// load that file
			const jsonData = tryOrError(
				`Invalid JSON file! File: ${realPath}!`,
				() => fs.readJSONSync(realPath),
			);

			// validating rojo config file
			if (rojo.Utils.isValidRojoConfig(jsonData)) {
				this.loadingConfigs.push(realPath);
				this.parseTree(
					path.dirname(configFilePath),
					jsonData.name,
					jsonData.tree,
					doNotPush,
				);

				this.loadingConfigs.pop();

				return jsonData;
			} else {
				throw new TransformerError(
					`From Rojo, invalid Rojo configuration! File: ${realPath}`,
				);
			}
		}
		throw new TransformerError(`From Rojo, invalid path: ${realPath}`);
	}

	// GETTERS //
	get config(): Readonly<RojoConfig> {
		return this._config;
	}

	get filePath(): Readonly<string> {
		return this._configFilePath;
	}

	get isGame(): Readonly<boolean> {
		return this._isGame;
	}

	/**
	 * Reloads the entire Rojo project
	 *
	 * **WARNING**: If the config file is deleted for some reason,
	 * it will throw out an error
	 */
	public reload() {
		// wiping everything
		this.filePathToRbxPath.clear();

		wipeArray(this.loadedDirectories);
		wipeArray(this.rbxPathCache);

		this._config = this.parseConfig(this._configFilePath, true);
		this._isGame = this._config.tree.$className === "DataModel";
	}

	/** Gets the roblox path from file path (if possible) */
	public getRbxPathFromFilePath(filePath: string): RbxPath | undefined {
		filePath = path.resolve(filePath);

		// file method
		const rbxPath = this.filePathToRbxPath.get(filePath);
		if (rbxPath) {
			return rbxPath;
		}

		// directory method
		for (const directory of this.loadedDirectories) {
			if (isPathDescendantOf(filePath, directory.realPath)) {
				const stripped = rojo.Utils.stripRojoExts(filePath);
				const relativePath = path.relative(
					directory.realPath,
					stripped,
				);
				const relativeParts =
					relativePath == "" ? [] : relativePath.split(path.sep);

				if (
					relativeParts[relativeParts.length - 1] === rojo.INIT_NAME
				) {
					relativeParts.pop();
				}

				return directory.rbxPath.concat(relativeParts);
			}
		}
	}

	/** Gets the roblox script type from file path */
	public getRbxTypeFromFilePath(filePath: string) {
		const subext = getSubExt(filePath);
		return SUB_EXT_TYPE_MAP.get(subext) ?? rojo.RbxScriptType.Unknown;
	}
}

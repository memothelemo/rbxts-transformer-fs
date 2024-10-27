/* eslint-disable @typescript-eslint/adjacent-overload-signatures */

/**
 * This macro allows to read the contents of the file as long as it does not exceed
 * the read size limit and it exists during build time.
 *
 * ```ts
 * // my-token.txt:
 * // SGVsbG8hIFRoYW5rIHlvdSBmb3Igd2FzdGluZyB5b3VyIHRpbWUgZGVjb2RpbmcgdGhpcyE=
 *
 * const contents = $readFile("my-token.txt")
 * assert(contents === "SGVsbG8hIFRoYW5rIHlvdSBmb3Igd2FzdGluZyB5b3VyIHRpbWUgZGVjb2RpbmcgdGhpcyE=");
 * ```
 *
 * You can also optionally read the file by adding/putting `true` in the second
 * argument of the `$readFile` function.
 *
 * If the file does not exist upon build time and optional file reading is enabled,
 * it will return `undefined` or `nil` in Roblox.
 *
 * ```ts
 * const contents = $readFile("invalid-file", true)
 * assert(contents === undefined);
 *
 * const token = $readFile("my-token.txt", true)
 * assert(contents === "SGVsbG8hIFRoYW5rIHlvdSBmb3Igd2FzdGluZyB5b3VyIHRpbWUgZGVjb2RpbmcgdGhpcyE=");
 * ```
 *
 * ### ⚠️ **Beware** ⚠️
 * If you're compiling your project in incremental mode, you may encounter that contents of a
 * specified file may be out of date if you don't update the file where this macro is used.
 * Incremental file system will be implemented soon in later unstable versions.
 *
 * @param path The path to read the file to.
 * @param optional Whether this function can return `undefined` if specified file does not exist.
 */
export function $readFile(path: string): string;
export function $readFile(path: string, optional: false): string;
export function $readFile(path: string, optional: true): string | undefined;

/**
 * It transforms into the current path of the file relative to the project directory
 * as long as the current file can be found inside your Rojo project configuration file.
 *
 * ```ts
 * // src/server/main.server.ts:
 * const contents = $FILE_NAME;
 * assert(contents === "src/server/main.server.ts");
 * ```
 */
export const $FILE_NAME: string;

/**
 * This macro will throw an error in build time if a specified file
 * in the first argument cannot be found.
 *
 * ```ts
 * // Error: Specified path not found
 * $expectFile("src");
 * ```
 *
 * You can also set custom error message for example, instruct contributors or
 * anyone wants to build your project on setting some required files in order to
 * build the entire roblox-ts project successfully.
 *
 * ```ts
 * // Error: Please setup your GitHub API key in `keys/github.txt`
 * $expectFile("keys/github.txt", "Please setup your GitHub API key in `keys/github.txt`");
 * ```
 *
 * @param path Specified file expected to be found
 * @param message Custom error message if specified file does not exist, defaults to `Specified path not found` if not set
 */
export function $expectFile(path: string, message?: string): void;

/**
 * This macro will throw an error in build time if a specified directory
 * in the first argument cannot be found.
 *
 * ```ts
 * // Error: Specified path not found
 * $expectDir("package.json");
 * ```
 *
 * You can also set custom error message for example, instruct contributors or
 * anyone wants to build your project on creating a directory in order to
 * build the entire roblox-ts project successfully.
 *
 * ```ts
 * // Error: Please run `wally install` to compile this project.
 * $expectDir("Packages", "Please run `wally install` to compile this project.");
 * $expectDir("DevPackages", "Please run `wally install` to compile this project.");
 * ```
 *
 * @param path Specified directory expected to be found
 * @param message Custom error message if specified directory does not exist, defaults to `Specified path not found` if not set
 */
export function $expectDir(path: string, message?: string): void;

/**
 * This macro will throw an error in build time if a specified path
 * in the first argument cannot be found (it can be a file or directory).
 *
 * ```ts
 * // Error: Specified path not found
 * $expectDir(".grit");
 * ```
 *
 * You can also set custom error message for example, instruct contributors or
 * anyone wants to build your project on creating a path (file or directory)
 * to build the entire roblox-ts project successfully.
 *
 * ```ts
 * // Error: Please run `wally install` to compile this project.
 * $expectPath("Packages", "Please run `wally install` to compile this project.");
 * $expectPath("DevPackages", "Please run `wally install` to compile this project.");
 *
 * // Error: Please setup your GitHub API key in `keys/github.txt`
 * $expectFile("keys/github.txt", "Please setup your GitHub API key in `keys/github.txt`");
 * ```
 *
 * @param path Specified directory expected to be found
 * @param message Custom error message if specified directory does not exist, defaults to `Specified path not found` if not set
 */
export function $expectPath(path: string, message?: string): void;

/**
 * This macro returns a boolean that whether a specified directory exists during build time.
 * `true` if it is exists or `false` if not.
 *
 * ```ts
 * // Assume src exists somewhere
 * const value = $dirExists("src");
 * assert(value === true);
 *
 * // Assume out does not exists
 * const value = $dirExists("out");
 * assert(value === false);
 * ```
 *
 * @param path Specified directory to check whether it exists or not
 */
export function $dirExists(path: string): boolean;

/**
 * This macro returns a boolean that whether a specified file exists during build time.
 * `true` if it is exists or `false` if not.
 *
 * ```ts
 * // Assume package.json exists somewhere
 * const value = $fileExists("package.json");
 * assert(value === true);
 *
 * // Assume src does not exists
 * const value = $fileExists("src");
 * assert(value === false);
 * ```
 *
 * @param path Specified file to check whether it exists or not
 */
export function $fileExists(path: string): boolean;

/**
 * This macro returns a boolean that whether a specified path (it can be a directory or file)
 * exists during build time. `true` if it is exists or `false` if not.
 *
 * ```ts
 * // Assume package.json exists somewhere
 * const value = $pathExists("package.json");
 * assert(value === true);
 *
 * // Assume src exists somewhere
 * const value = $pathExists("src");
 * assert(value === true);
 *
 * // Assume out does not exists
 * const value = $pathExists("out");
 * assert(value === false);
 * ```
 *
 * @param path Specified path to check whether it exists or not
 */
export function $pathExists(path: string): boolean;

/**
 * Computes the hash value or hex encoded checksum of a file during build time.
 *
 * ```ts
 * const hash = $hashFile("LICENSE.txt", "sha256");
 * assert(hash === "ff238b69d71c5c644275e03856658d2f3e1f40bad81f0de352d8709ef600b7e2");
 * ```
 *
 * ### ⚠️ **Beware** ⚠️
 * If you're compiling your project in incremental mode, you may encounter that the hash value
 * of a file may be out of date if you don't update the file where this macro is used.
 * Incremental file system will be implemented soon in later unstable versions.
 *
 * @param path Specified file to generate a hash value or hex encoded checksum
 * @param alg Hashing algorithm to generate a hash value from a value
 */
export function $hashFile(path: string, alg: "sha1" | "sha256" | "sha512" | "md5"): string;

/**
 * This macro translates specificed path into a Roblox path where it may be located in
 * Roblox space depending on your Rojo configuration file. It will throw an error if the
 * specified Roblox path or within the segments (for example: `Workspace.Foo.Bar` -> `Workspace`, `Foo` or `Bar`)
 * cannot be found.
 *
 * It is useful for referencing objects by using the filesystem path instead
 * of defining it with a global type which it cannot be guaranteed to be found.
 *
 * ```ts
 * // Let's say, you want to get the `Assets` object which is located at `ReplicatedStorage.Assets`
 * // in Roblox tree (`assets` in Rojo tree) but you don't want to define a global type of something like this:
 * //
 * // // inside the global.d.ts file:
 * // interface ReplicatedStorage {
 * //     Assets: Folder;
 * // }
 * //
 * // You can get the `Assets` folder by calling $instance macro.
 * // This is equivalent to: game:GetService("ReplicatedStorage").Assets
 * const Assets = $instance("assets");
 * ```
 *
 * You can also checks whether the referenced object passes the requirements of the type argument
 * specified (*throws an error if it does not pass the type guard*).
 *
 * ```ts
 * // Makes sure that Assets object must be a class of Folder.
 * interface Assets extends Folder {
 *      // Makes sure that Assets folder has Prefabs folder.
 *      Prefabs: Folder;
 * }
 *
 * const Assets = $instance<Assets>("assets");
 * ```
 *
 * **They are things that you need to be aware when using this macro**:
 *
 * If your current file is in the client side and target file is within `StarterPlayerScripts`,
 * `StarterPlayerScripts`, `StarterGui` or `StarterPack`, `rbxts-transformer-fs` automatically
 * converts these paths into the LocalPlayer's designated locations for you:
 *
 * ```txt
 * StarterPlayerScripts -> LocalPlayer.PlayerScripts
 * StarterCharacterScripts -> LocalPlayer.Character
 * StarterGui -> LocalPlayer.PlayerGui
 * StarterPack -> LocalPlayer.Backpack
 * ```
 *
 * However, using `StarterGear` in client side is not allowed as the server has the authority
 * to modify and access stuff inside the `StarterGear`.
 *
 * If you don't intend to access for example: `LocalPlayer.PlayerGui` but intending to access
 * `StarterGui` in the client side, you can use `$instance.exact` which it references to the
 * exact Roblox tree without any conversions.
 *
 * ### ⚠️ **Beware** ⚠️
 * If you're compiling your project in incremental mode, you may encounter that the Roblox
 * path of a referenced instance may be out of date if you don't update the file where this
 * macro is used. Incremental file system will be implemented soon in later unstable versions.
 *
 * @param path Specified path to reference a Roblox object.
 */
export function $instance<T extends Instance = Instance>(path: string): T;
export namespace $instance {
    /**
     * This macro translates specificed path into a Roblox path where it may be located in
     * Roblox space depending on your Rojo configuration file. It will throw an error if the
     * specified Roblox path or within the segments (for example: `Workspace.Foo.Bar` -> `Workspace`, `Foo` or `Bar`)
     * cannot be found.
     *
     * Unlike the `$instance` macro, this function returns the Roblox path of exactly where the
     * configuration may be located depending on your Rojo configuration file without any
     * conversions and so on.
     *
     * *For example, referencing `src/client/main.server.ts` will go to `game.StarterPlayer.StarterPlayerScripts.main`
     * instead of `game.Players.LocalPlayer.PlayerScripts.main`.*
     *
     * It is useful for referencing objects by using the filesystem path instead
     * of defining it with a global type which it cannot be guaranteed to be found.
     *
     * ```ts
     * // Let's say, you want to get the `Assets` object which is located at `ReplicatedStorage.Assets`
     * // in Roblox tree (`assets` in Rojo tree) but you don't want to define a global type of something like this:
     * //
     * // // inside the global.d.ts file:
     * // interface ReplicatedStorage {
     * //     Assets: Folder;
     * // }
     * //
     * // You can get the `Assets` folder by calling $instance macro.
     * // This is equivalent to: game:GetService("ReplicatedStorage").Assets
     * const Assets = $instance.exact("assets");
     * ```
     *
     * You can also checks whether the referenced object passes the requirements of the type argument
     * specified (*throws an error if it does not pass the type guard*).
     *
     * ```ts
     * // Makes sure that Assets object must be a class of Folder.
     * interface Assets extends Folder {
     *      // Makes sure that Assets folder has Prefabs folder.
     *      Prefabs: Folder;
     * }
     *
     * const Assets = $instance.exact<Assets>("assets");
     * ```
     *
     * ### ⚠️ **Beware** ⚠️
     * If you're compiling your project in incremental mode, you may encounter that the Roblox
     * path of a referenced instance may be out of date if you don't update the file where this
     * macro is used. Incremental file system will be implemented soon in later unstable versions.
     *
     * @param path Specified path to reference a Roblox object.
     */
    export function exact<T extends Instance = Instance>(path: string): T;
}

/**
 * This macro translates specificed path into a Roblox path where it may be located in
 * Roblox space depending on your Rojo configuration file. It will return a `nil` value
 * if the specified Roblox path or within the segments (for example: `Workspace.Foo.Bar` ->
 * `Workspace`, `Foo` or `Bar`) cannot be found.
 *
 * It is useful for referencing objects by using the filesystem path instead
 * of defining it with a global type which it cannot be guaranteed to be found.
 *
 * ```ts
 * // Let's say, you want to get the `Assets` object which is located at `ReplicatedStorage.Assets`
 * // in Roblox tree (`assets` in Rojo tree) but you don't want to define a global type of something like this:
 * //
 * // // inside the global.d.ts file:
 * // interface ReplicatedStorage {
 * //     Assets?: Folder;
 * // }
 * //
 * // You can get the `Assets` folder by calling $findInstance macro.
 * // This is equivalent to: game:GetService("ReplicatedStorage").Assets
 * const Assets = $findInstance("assets");
 * ```
 *
 * You can also checks whether the referenced object passes the requirements of the type argument
 * specified if the referenced object is found (*throws an error if it does not pass the type guard*).
 *
 * ```ts
 * // Makes sure that Assets object must be a class of Folder.
 * interface Assets extends Folder {
 *      // Makes sure that Assets folder has Prefabs folder.
 *      Prefabs: Folder;
 * }
 *
 * const Assets = $findInstance<Assets>("assets");
 * ```
 *
 * **They are things that you need to be aware when using this macro**:
 *
 * If your current file is in the client side and target file is within `StarterPlayerScripts`,
 * `StarterPlayerScripts`, `StarterGui` or `StarterPack`, `rbxts-transformer-fs` automatically
 * converts these paths into the LocalPlayer's designated locations for you:
 *
 * ```txt
 * StarterPlayerScripts -> LocalPlayer.PlayerScripts
 * StarterCharacterScripts -> LocalPlayer.Character
 * StarterGui -> LocalPlayer.PlayerGui
 * StarterPack -> LocalPlayer.Backpack
 * ```
 *
 * However, using `StarterGear` in client side is not allowed as the server has the authority
 * to modify and access stuff inside the `StarterGear`.
 *
 * If you don't intend to access for example: `LocalPlayer.PlayerGui` but intending to access
 * `StarterGui` in the client side, you can use `$instance.exact` which it references to the
 * exact Roblox tree without any conversions.
 *
 * ### ⚠️ **Beware** ⚠️
 * If you're compiling your project in incremental mode, you may encounter that the Roblox
 * path of a referenced instance may be out of date if you don't update the file where this
 * macro is used. Incremental file system will be implemented soon in later unstable versions.
 *
 * @param path Specified path to reference a Roblox object.
 */
export function $findInstance<T extends Instance = Instance>(path: string): T | undefined;
export namespace $findInstance {
    /**
     * This macro translates specificed path into a Roblox path where it may be located in
     * Roblox space depending on your Rojo configuration file. It will return a `nil` value
     * if the specified Roblox path or within the segments (for example: `Workspace.Foo.Bar` ->
     * `Workspace`, `Foo` or `Bar`) cannot be found.
     *
     * Unlike the `$findInstance` macro, this function returns the Roblox path of exactly where the
     * configuration may be located depending on your Rojo configuration file without any
     * conversions and so on.
     *
     * *For example, referencing `src/client/main.server.ts` will go to `game.StarterPlayer.StarterPlayerScripts.main`
     * instead of `game.Players.LocalPlayer.PlayerScripts.main`.*
     *
     * It is useful for referencing objects by using the filesystem path instead
     * of defining it with a global type which it cannot be guaranteed to be found.
     *
     * ```ts
     * // Let's say, you want to get the `Assets` object which is located at `ReplicatedStorage.Assets`
     * // in Roblox tree (`assets` in Rojo tree) but you don't want to define a global type of something like this:
     * //
     * // // inside the global.d.ts file:
     * // interface ReplicatedStorage {
     * //     Assets?: Folder;
     * // }
     * //
     * // You can get the `Assets` folder by calling $findInstance macro.
     * // This is equivalent to: game:GetService("ReplicatedStorage").Assets
     * const Assets = $findInstance.exact("assets");
     * ```
     *
     * You can also checks whether the referenced object passes the requirements of the type argument
     * specified if the referenced object is found (*throws an error if it does not pass the type guard*).
     *
     * ```ts
     * // Makes sure that Assets object must be a class of Folder.
     * interface Assets extends Folder {
     *      // Makes sure that Assets folder has Prefabs folder.
     *      Prefabs: Folder;
     * }
     *
     * const Assets = $findInstance.exact<Assets>("assets");
     * ```
     *
     * ### ⚠️ **Beware** ⚠️
     * If you're compiling your project in incremental mode, you may encounter that the Roblox
     * path of a referenced instance may be out of date if you don't update the file where this
     * macro is used. Incremental file system will be implemented soon in later unstable versions.
     *
     * @param path Specified path to reference a Roblox object.
     */
    export function exact<T extends Instance = Instance>(path: string): T | undefined;
}

/**
 * This macro translates specificed path into a Roblox path where it may be located in
 * Roblox space depending on your Rojo configuration file.
 *
 * Unlike `$instance` and `$findInstance`, this macro behaves like [`:WaitForChild(...)`](https://create.roblox.com/docs/reference/engine/classes/Instance#WaitForChild)
 * where each path segment of the referenced object (`Workspace.Foo.Bar -> Workspace, then Foo, then Bar`)
 * waits to be existed before it returns the referenced object.
 *
 * It is useful for referencing objects which it cannot be guaranteed to be found.
 *
 * ```ts
 * // Let's say, you want to get the `Assets` object which is located at `ReplicatedStorage.Assets`
 * // in Roblox tree (`assets` in Rojo tree) but you don't want to define a global type of something like this:
 * //
 * // // inside the global.d.ts file:
 * // interface ReplicatedStorage {
 * //     Assets: Folder;
 * // }
 * //
 * // You can get the `Assets` folder by calling $waitForInstance macro.
 * // This is equivalent to: game:GetService("ReplicatedStorage").Assets
 * const Assets = $waitForInstance("assets");
 * ```
 *
 * Unlike `$instance` and `$findInstance`, using type guards during this version are not
 * allowed to be used as the developer have to come up with a plan on how to wait for instances
 * inside the guard type as well.
 *
 * **They are things that you need to be aware when using this macro**:
 *
 * If your current file is in the client side and target file is within `StarterPlayerScripts`,
 * `StarterPlayerScripts`, `StarterGui` or `StarterPack`, `rbxts-transformer-fs` automatically
 * converts these paths into the LocalPlayer's designated locations for you:
 *
 * ```txt
 * StarterPlayerScripts -> LocalPlayer.PlayerScripts
 * StarterCharacterScripts -> LocalPlayer.Character
 * StarterGui -> LocalPlayer.PlayerGui
 * StarterPack -> LocalPlayer.Backpack
 * ```
 *
 * However, using `StarterGear` in client side is not allowed as the server has the authority
 * to modify and access stuff inside the `StarterGear`.
 *
 * If you don't intend to access for example: `LocalPlayer.PlayerGui` but intending to access
 * `StarterGui` in the client side, you can use `$instance.exact` which it references to the
 * exact Roblox tree without any conversions.
 *
 * ### ⚠️ **Beware** ⚠️
 * If you're compiling your project in incremental mode, you may encounter that the Roblox
 * path of a referenced instance may be out of date if you don't update the file where this
 * macro is used. Incremental file system will be implemented soon in later unstable versions.
 *
 * @param path Specified path to reference a Roblox object.
 * @param timeout
 */
export function $waitForInstance<T extends Instance = Instance>(path: string): T;
export function $waitForInstance<T extends Instance = Instance>(
    path: string,
    timeout: number,
): T | undefined;
export namespace $waitForInstance {
    /**
     * This macro translates specificed path into a Roblox path where it may be located in
     * Roblox space depending on your Rojo configuration file.
     *
     * Unlike `$instance` and `$findInstance`, this macro behaves like [`:WaitForChild(...)`](https://create.roblox.com/docs/reference/engine/classes/Instance#WaitForChild)
     * where each path segment of the referenced object (`Workspace.Foo.Bar -> Workspace, then Foo, then Bar`)
     * waits to be existed before it returns the referenced object.
     *
     * Also unlike the `$waitForInstance` macro, this function returns the Roblox path of exactly where the
     * configuration may be located depending on your Rojo configuration file without any
     * conversions and so on.
     *
     * * *For example, referencing `src/client/main.server.ts` will go to `game.StarterPlayer.StarterPlayerScripts.main`
     * instead of `game.Players.LocalPlayer.PlayerScripts.main`.*
     *
     * It is useful for referencing objects which it cannot be guaranteed to be found.
     *
     * ```ts
     * // Let's say, you want to get the `Assets` object which is located at `ReplicatedStorage.Assets`
     * // in Roblox tree (`assets` in Rojo tree) but you don't want to define a global type of something like this:
     * //
     * // // inside the global.d.ts file:
     * // interface ReplicatedStorage {
     * //     Assets: Folder;
     * // }
     * //
     * // You can get the `Assets` folder by calling $waitForInstance macro.
     * // This is equivalent to: game:GetService("ReplicatedStorage").Assets
     * const Assets = $waitForInstance("assets");
     * ```
     *
     * Unlike `$instance` and `$findInstance`, using type guards during this version are not
     * allowed to be used as the developer have to come up with a plan on how to wait for instances
     * inside the guard type as well.
     *
     * ### ⚠️ **Beware** ⚠️
     * If you're compiling your project in incremental mode, you may encounter that the Roblox
     * path of a referenced instance may be out of date if you don't update the file where this
     * macro is used. Incremental file system will be implemented soon in later unstable versions.
     *
     * @param path Specified path to reference a Roblox object.
     * @param timeout
     */
    export function exact<T extends Instance = Instance>(path: string): T;
    export function exact<T extends Instance = Instance>(
        path: string,
        timeout: number,
    ): T | undefined;
}

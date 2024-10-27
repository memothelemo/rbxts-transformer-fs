/* eslint-disable @typescript-eslint/adjacent-overload-signatures */

export function $readFile(path: string): string;
export function $readFile(path: string, optional: false): string;
export function $readFile(path: string, optional: true): string | undefined;

export const $FILE_NAME: string;

export function $expectFile(path: string, message?: string): void;
export function $expectDir(path: string, message?: string): void;
export function $expectPath(path: string, message?: string): void;

export function $dirExists(path: string): boolean;
export function $fileExists(path: string): boolean;
export function $pathExists(path: string): boolean;

export function $hashFile(path: string, alg: "sha1" | "sha256" | "sha512" | "md5"): string;

export function $instance<T extends Instance = Instance>(path: string): T;
export namespace $instance {
    export function exact<T extends Instance = Instance>(path: string): T;
}

export function $findInstance<T extends Instance = Instance>(path: string): T | undefined;
export namespace $findInstance {
    export function exact<T extends Instance = Instance>(path: string): T | undefined;
}

export function $waitForInstance<T extends Instance = Instance>(path: string): T;
export function $waitForInstance<T extends Instance = Instance>(
    path: string,
    timeout: number,
): T | undefined;
export namespace $waitForInstance {
    export function exact<T extends Instance = Instance>(path: string): T;
    export function exact<T extends Instance = Instance>(
        path: string,
        timeout: number,
    ): T | undefined;
}

// export function $instances(...paths: string[]): Instance[];
// export namespace $instances {
//     export function exact(...paths: string[]): Instance[];
// }

// export function $waitForInstances(...paths: string[]): Instance[];
// export namespace $waitForInstances {
//     export function exact(...paths: string[]): Instance[];
// }

// export function $findInstance<T extends Instance = Instance>(path: string, exactPath?: boolean): T | undefined;
// export function $waitForInstance<T extends Instance = Instance>(path: string, timeout?: number, exactPath?: boolean): T;

// export function $require(path: string, exact?: boolean): unknown;

// export function $instances(exact: boolean, ...paths: string[]): Instance[];
// export function $instances(...paths: string[]): Instance[];

// export function $waitForInstances(exact: boolean, ...paths: string[]): Instance[];
// export function $waitForInstances(...paths: string[]): Instance[];

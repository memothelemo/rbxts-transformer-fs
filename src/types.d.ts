type Required<T> = {
    [K in keyof T]-?: T[K];
};

type Writable<T extends object> = {
    -readonly [K in keyof T]: T[K];
};

declare namespace require {
    function resolve(request: string, options: { paths: string[] });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function require(name: string): any;

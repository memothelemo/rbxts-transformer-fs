// Implementation of Iterator::fold in Rust
function foldArrays<T, V>(
    array: readonly T[],
    defaultValue: V,
    callback: (accumulator: V, value: T) => V,
): V {
    let accumulator = defaultValue;
    for (const element of array) {
        accumulator = callback(accumulator, element);
    }
    return accumulator;
}

export function zipArrays<T>(array_1: readonly T[]): readonly T[];
export function zipArrays<A, B>(array_1: readonly A[], array_2: readonly B[]): readonly [A, B][];
export function zipArrays<A, B, C>(
    array_1: readonly A[],
    array_2: readonly B[],
    array_3: readonly C[],
): readonly [A, B, C][];
export function zipArrays<A, B, C, D>(
    array_1: readonly A[],
    array_2: readonly B[],
    array_3: readonly C[],
    array_4: readonly D[],
): readonly [A, B, C, D][];
export function zipArrays<A, B, C, D, E>(
    array_1: readonly A[],
    array_2: readonly B[],
    array_3: readonly C[],
    array_4: readonly D[],
): readonly [A, B, C, D, E][];
export function zipArrays(...arrays: readonly ReadonlyArray<unknown>[]): readonly unknown[][] {
    // Get the minimum length for all arrays
    const minimumLength = foldArrays(arrays, Number.MAX_VALUE as number, (minLength, array) =>
        array.length < minLength ? array.length : minLength,
    );

    // optimization purposes
    if (minimumLength === 0) return [];

    const zippedArray = new Array<unknown[]>(minimumLength);
    for (let id = 0; id < minimumLength; id++) {
        for (const array of arrays) {
            const tuple = zippedArray[id] === undefined ? (zippedArray[id] = []) : zippedArray[id];
            tuple.push(array[id]);
        }
    }

    return zippedArray;
}

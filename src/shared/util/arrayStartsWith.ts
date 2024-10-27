export function arrayStartsWith<T>(left: readonly T[], pattern: readonly T[]): boolean {
    if (left.length < pattern.length) return false;

    for (let id = 0; id < pattern.length; id++) {
        const patternValue = pattern[id];
        const leftValue = left[id];
        if (leftValue !== patternValue) return false;
    }

    return true;
}

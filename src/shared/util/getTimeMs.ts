// Copied from: https://github.com/rbxts-flamework/transformer/blob/4e7d33c5034ae08eeb63b8f007f7c226042503a4/src/classes/logger.ts#L8C1-L10C44
export function getTimeMs() {
    const hrTime = process.hrtime();
    return hrTime[0] * 1000 + hrTime[1] / 1e6;
}

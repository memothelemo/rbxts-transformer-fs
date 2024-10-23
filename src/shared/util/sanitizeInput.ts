// Node.js cannot not import `ansi-regex` because of inconsistents with ESM
function ansiRegex() {
    // Valid string terminator sequences are BEL, ESC\, and 0x9c
    const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
    const pattern = [
        `[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?${ST})`,
        "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
    ].join("|");

    return new RegExp(pattern, "g");
}

/**
 * Sanitizes user's input by:
 * - Stripping any ANSI escapes
 */
export function sanitizeInput(text: string): string {
    return text.replace(ansiRegex(), "");
}

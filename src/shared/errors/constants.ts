import ansi from "ansi-colors";
import { PKG_JSON } from "../util/package";

/* eslint-disable prettier/prettier */
export const OUTDATED_RBXTSC_TXT = `Invalid source file! Please consider installing local version of roblox-ts or downgrade/upgrade your TypeScript version roblox-ts supports.
Solution #1: Use local version of roblox-ts:
${ansi.greenBright("npm i -D roblox-ts")}

To compile, type: ${ansi.greenBright("npx rbxtsc")}

Solution #2: To downgrade to specific version of TypeScript:
${ansi.greenBright("npm i -D typescript@=VERSION_HERE")} ${ansi.redBright("<-- Do not include `VERSION_HERE`, use version roblox-ts supports")}

If possible solutions are failed, please send an issue in transformer's Github repository (probably forgot to update TS version):
${ansi.yellowBright(PKG_JSON.bugs.url)}
`;

export const TERMINATING_COMPILER_PROCESS_TXT = "Terminating compiler program because of this error";

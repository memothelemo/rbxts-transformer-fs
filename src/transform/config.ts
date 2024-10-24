import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export type Config = Required<z.infer<typeof checker>>;

// TODO: parse human file sizes from string values
const checker = z.object({
    debug: z.boolean().optional(),
    hashFileSizeLimit: z.number().positive().optional(),
    readFileSizeLimit: z.number().positive().optional(),
    dumpTransformedFiles: z.boolean().optional(),

    $internal: z
        .object({
            logAllFiles: z.boolean().optional(),
            logDeclaredMacros: z.boolean().optional(),
            logModuleResolution: z.boolean().optional(),
        })
        .optional(),
});

const defaults: Config = {
    debug: false,
    // 4 GB limit, we're using streaming anyway if the file is too big!
    hashFileSizeLimit: 4 * 1000 * 1000 * 1000,
    // 10 KB limit only...
    readFileSizeLimit: 10 * 1000,
    dumpTransformedFiles: false,

    $internal: {
        logAllFiles: false,
        logDeclaredMacros: false,
        logModuleResolution: false,
    },
};

export function parseConfig(raw: unknown) {
    let config = {} as Config;
    if (raw !== undefined) {
        const result = checker.safeParse(raw);
        if (result.success) {
            config = raw as Config;
        } else {
            const message = fromZodError(result.error);
            throw new Error(`Failed to parse transformer config: ${message}`);
        }
    }

    for (const [key, value] of Object.entries(defaults)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((config as any)[key] as any) ??= value;
    }

    return config;
}

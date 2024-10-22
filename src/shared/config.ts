import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export type TransformConfig = Required<z.infer<typeof checker>>;

const checker = z.object({
  debug: z.boolean().optional(),
  hashFileSizeLimit: z.number().positive().optional(),
  readFileSizeLimit: z.number().positive().optional(),
  saveTransformedFiles: z.boolean().optional(),
});

const defaults: TransformConfig = {
  debug: false,
  // 4 GB limit, we're using streaming anyway if the file is too big!
  hashFileSizeLimit: 4 * 1000 * 1000 * 1000,
  // 10 KB limit only...
  readFileSizeLimit: 10 * 1000,
  saveTransformedFiles: false,
};

export function parseTransformConfig(raw: unknown) {
  let config = {} as TransformConfig;
  if (raw !== undefined) {
    const result = checker.safeParse(raw);
    if (result.success) {
      config = raw as TransformConfig;
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

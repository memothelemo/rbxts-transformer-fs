import { z } from "zod";
import { fromZodError } from "zod-validation-error";

/**
 * Configuration for `rbxts-transformer-fs`
 */
export type TransformConfig = Required<z.infer<typeof configChecker>>;

type Required<T> = {
  [K in keyof T]-?: T[K];
};

const configChecker = z.object({
  debug: z.boolean().optional(),
  // watchHashedFiles: z.boolean().optional(),
  emitOutputFiles: z.boolean().optional(),
  hashFileSizeLimit: z.number().positive().optional(),
  readFileSizeLimit: z.number().positive().optional(),
  typeCheckInstances: z.boolean().optional(),
});

const DEFAULTS: TransformConfig = {
  debug: false,
  emitOutputFiles: false,
  /** 20 MB limit */
  hashFileSizeLimit: 20 * 1000 * 1000,
  /** 100 KB limit */
  readFileSizeLimit: 100 * 1000,
  typeCheckInstances: true,
  // watchHashedFiles: false,
};

/**
 * Attempts to parse the `TransformConfig`.
 *
 * It will throw an error if it fails to parse `TransformConfig`.
 */
export function parseTransformConfig(raw: unknown) {
  let config = {} as TransformConfig;
  if (raw !== undefined) {
    const result = configChecker.safeParse(raw);
    if (result.success) {
      config = raw as TransformConfig;
    } else {
      const message = fromZodError(result.error);
      throw new Error(`Failed to parse transformer config: ${message}`);
    }
  }

  for (const [key, value] of Object.entries(DEFAULTS)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((config as any)[key] as any) ??= value;
  }

  return config;
}

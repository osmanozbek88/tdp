import { z } from "zod";

const envSchema = z.object({
  // ─── Application ───
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  APP_NAME: z.string().default("tdp"),
  APP_URL: z.string().url().default("http://localhost:3005"),
  PORT: z.coerce.number().default(3005),

  // ─── Database ───
  DATABASE_URL: z.string().url(),

  // ─── Auth ───
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_URL: z.string().url(),

  // ─── Provider ───
  PROVIDER_TYPE: z.enum(["fake", "telna"]).default("fake"),
  TELNA_API_KEY: z.string().optional(),
  TELNA_API_URL: z.string().url().optional(),

  // ─── Logging ───
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  LOG_PRETTY: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Returns validated, type-safe environment variables.
 * Validates once and caches the result.
 */
export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .filter((i) => i.code === "invalid_type" && i.received === "undefined")
      .map((i) => i.path.join("."));

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`,
      );
    }

    throw new Error(`Environment validation failed: ${result.error.message}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

/**
 * Resets the cached config (useful in tests).
 */
export function resetEnv(): void {
  cachedEnv = null;
}

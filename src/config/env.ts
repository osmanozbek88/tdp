import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  APP_NAME: z.string().default("tdp"),
  APP_URL: z.string().url().default("http://localhost:3002"),
  PORT: z.coerce.number().default(3002),

  DATABASE_URL: z.string().url(),

  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().default("http://localhost:3000"),

  PROVIDER_TYPE: z.enum(["fake", "telna"]).default("fake"),
  TELNA_API_KEY: z.string().optional(),
  TELNA_API_URL: z.string().url().optional(),

  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  LOG_PRETTY: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const formatted = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(", ")}`)
      .join("\n");

    throw new Error(
      `Environment variable validation failed:\n${formatted}\n\n` +
        "Check .env.example for required variables.",
    );
  }

  cachedEnv = result.data;
  return cachedEnv;
}

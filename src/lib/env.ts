import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url("DATABASE_URL debe ser una URL válida"),
  DIRECT_URL: z.string().url("DIRECT_URL debe ser una URL válida"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET requiere 32+ caracteres"),
  WEBHOOK_SIGNING_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  PUBLIC_API_KEY: z.string().min(20),
  PUBLIC_API_RESTAURANT_ID: z.string().min(1),
});

function parseEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");

    throw new Error(`\nVariables de entorno invalidas:\n${issues}\n`);
  }

  return parsed.data;
}

export const env = parseEnv();

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";

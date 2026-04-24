import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { z } from "zod";

const dotenvCandidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env")
];

for (const candidate of dotenvCandidates) {
  if (existsSync(candidate)) {
    config({ path: candidate });
    break;
  }
}

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(4050),
    WEB_URL: z.string().url().default("http://localhost:3200"),
    DATABASE_URL: z.string().min(1),
    SESSION_COOKIE_NAME: z.string().default("avs_session"),
    SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
    PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(60),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().default("noreply@agentic.local"),
    ANTHROPIC_API_KEY: z.string().min(1),
    ANTHROPIC_MODEL: z.string().default("claude-opus-4-7")
  })
  .refine(
    (data) => !data.SMTP_HOST || (data.SMTP_USER && data.SMTP_PASS),
    { message: "SMTP_USER and SMTP_PASS are required when SMTP_HOST is set" }
  );

export const env = EnvSchema.parse(process.env);

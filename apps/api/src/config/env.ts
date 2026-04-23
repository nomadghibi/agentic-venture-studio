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

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4050),
  WEB_URL: z.string().url().default("http://localhost:3200"),
  DATABASE_URL: z.string().min(1),
  SESSION_COOKIE_NAME: z.string().default("avs_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30)
});

export const env = EnvSchema.parse(process.env);

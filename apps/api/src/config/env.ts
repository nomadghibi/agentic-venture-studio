import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { UserRoleValues } from "@avs/types";
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
  WEB_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  DEFAULT_USER_ID: z.string().default("dev-founder"),
  DEFAULT_USER_ROLE: z.enum(UserRoleValues).default("founder"),
  DEFAULT_USER_EMAIL: z.string().email().default("founder@agentic.local")
});

export const env = EnvSchema.parse(process.env);

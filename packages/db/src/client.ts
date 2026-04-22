import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { Pool } from "pg";

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

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set for @avs/db");
}

export const db = new Pool({ connectionString });

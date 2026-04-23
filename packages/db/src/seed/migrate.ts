import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { db } from "../client.js";

const MIGRATION_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

async function ensureMigrationTable() {
  await db.query(MIGRATION_TABLE_SQL);
}

async function hasMigration(filename: string): Promise<boolean> {
  const result = await db.query<{ exists: boolean }>(
    `
      SELECT EXISTS(
        SELECT 1
        FROM schema_migrations
        WHERE filename = $1
      ) AS exists
    `,
    [filename]
  );

  return result.rows[0]?.exists ?? false;
}

async function markMigrationApplied(filename: string): Promise<void> {
  await db.query(
    `
      INSERT INTO schema_migrations (filename)
      VALUES ($1)
      ON CONFLICT (filename) DO NOTHING
    `,
    [filename]
  );
}

async function bootstrapLegacyInitialMigration() {
  const alreadyTracked = await hasMigration("0001_initial.sql");
  if (alreadyTracked) {
    return;
  }

  const result = await db.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      ) AS exists
    `
  );

  const usersTableExists = result.rows[0]?.exists ?? false;
  if (usersTableExists) {
    await markMigrationApplied("0001_initial.sql");
  }
}

async function migrate() {
  await ensureMigrationTable();
  await bootstrapLegacyInitialMigration();

  const migrationsDirectory = resolve(process.cwd(), "migrations");
  const entries = await readdir(migrationsDirectory, { withFileTypes: true });
  const migrationFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  for (const migrationFile of migrationFiles) {
    const applied = await hasMigration(migrationFile);
    if (applied) {
      console.log("Migration skipped (already applied):", migrationFile);
      continue;
    }

    const filePath = resolve(migrationsDirectory, migrationFile);
    const sql = await readFile(filePath, "utf8");
    await db.query(sql);
    await markMigrationApplied(migrationFile);
    console.log("Migration applied:", migrationFile);
  }

  await db.end();
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});

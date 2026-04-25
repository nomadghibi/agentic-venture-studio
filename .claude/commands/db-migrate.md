# /db-migrate

Create a new SQL migration file, apply it to the database, and rebuild the `@avs/db` package so updated types are available immediately.

## Usage

```
/db-migrate <migration-name>
```

Example: `/db-migrate add-opportunity-tags-column`

## Steps

1. **Find the next migration number** by listing `packages/db/migrations/` and finding the highest `NNNN_` prefix. Increment by 1, zero-padded to 4 digits.

2. **Create the migration file** at `packages/db/migrations/<NNNN>_<slugified-name>.sql`. Slug rules: lowercase, spaces and underscores normalized to `_`, no special characters.

   Start with a commented header:
   ```sql
   -- Migration: <NNNN>_<name>.sql
   -- Created: <today's date>
   -- <one-line description of what this migration does>
   ```

   Then write the SQL body. If the user gave a description of what to change, write the SQL. If they only gave a name, write a placeholder comment block:
   ```sql
   -- TODO: Add your SQL here.
   -- Use IF NOT EXISTS / IF EXISTS guards on all DDL to make this idempotent.
   -- Wrap in a transaction if multiple statements must succeed together:
   --   BEGIN; ... COMMIT;
   ```
   Then stop and show the file — ask the user to fill in the SQL before proceeding.

3. **Once the SQL is ready**, run the migration:
   ```bash
   pnpm --filter @avs/db db:migrate
   ```
   The migrate script (`packages/db/src/seed/migrate.ts`) runs all unapplied `.sql` files from `packages/db/migrations/` in order.

4. **Rebuild `@avs/db`** so TypeScript picks up any new types:
   ```bash
   pnpm --filter @avs/db build
   ```

5. **Report what happened:**
   - Migration file path
   - Whether the migration was applied (new) or skipped (already applied)
   - Build success or any TypeScript errors

## Notes

- Migrations are tracked in the `schema_migrations` table (filename as primary key). Re-running is safe — already-applied files are skipped.
- If the `DATABASE_URL` env var is not set, remind the user to check `.env` at the repo root.
- Do not run `db:seed` as part of this skill — seeding is separate from migrations.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { db } from "../client.js";

async function migrate() {
  const filePath = resolve(process.cwd(), "migrations/0001_initial.sql");
  const sql = await readFile(filePath, "utf8");
  await db.query(sql);
  await db.end();
  console.log("Migration applied:", filePath);
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});

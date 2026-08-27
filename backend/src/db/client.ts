import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";

import * as schema from "./schema";

const dbPath = process.env.DATABASE_PATH ?? path.resolve(process.cwd(), "data/app.db");

if (dbPath !== ":memory:") {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

export const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

const candidateMigrationPaths = [
  path.resolve(process.cwd(), "backend/drizzle"),
  path.resolve(process.cwd(), "drizzle"),
  path.resolve(__dirname, "../../drizzle"),
  path.resolve(__dirname, "../../../drizzle"),
];

for (const migrationPath of candidateMigrationPaths) {
  if (fs.existsSync(path.join(migrationPath, "meta/_journal.json"))) {
    try {
      migrate(db, { migrationsFolder: migrationPath });
      break;
    } catch (error) {
      console.error(`Failed to run migrations from ${migrationPath}:`, error);
    }
  }
}

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

const DEFAULT_DB_PATH = "data/app.db";

const dbPath = process.env.DATABASE_PATH ?? DEFAULT_DB_PATH;
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    branch TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS group_contacts (
    group_id TEXT NOT NULL REFERENCES groups(id),
    contact_id TEXT NOT NULL REFERENCES contacts(id),
    UNIQUE(group_id, contact_id)
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    sender TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL,
    scheduled_at TEXT,
    sent_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS campaign_target_groups (
    campaign_id TEXT NOT NULL REFERENCES campaigns(id),
    group_id TEXT NOT NULL REFERENCES groups(id),
    UNIQUE(campaign_id, group_id)
  );
`);

export const db = drizzle(sqlite, { schema });

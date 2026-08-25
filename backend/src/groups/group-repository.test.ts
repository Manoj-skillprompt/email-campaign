import type { Group } from "@email-campaign-v2/contracts";
import type Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { GroupRepository as GroupRepositoryClass } from "./group-repository";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../drizzle");

function applyMigrations(sqlite: Database.Database) {
  const migrationFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    sqlite.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8"));
  }
}

function buildGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: crypto.randomUUID(),
    name: `Group ${crypto.randomUUID()}`,
    contactIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

let sqlite: Database.Database;
let repository: GroupRepositoryClass;

beforeAll(async () => {
  process.env.DATABASE_PATH = ":memory:";
  const clientModule = await import("../db/client");
  sqlite = clientModule.sqlite;
  applyMigrations(sqlite);
  const repositoryModule = await import("./group-repository");
  repository = repositoryModule.groupRepository;
});

beforeEach(() => {
  sqlite.exec("DELETE FROM groups");
});

afterAll(() => {
  sqlite.close();
});

describe("GroupRepository", () => {
  it("creates a group and returns it", async () => {
    const group = buildGroup();

    const created = await repository.create(group);

    expect(created).toEqual(group);
    expect(await repository.findById(group.id)).toEqual(group);
  });

  it("finds all groups when no search term is given", async () => {
    await repository.create(buildGroup({ name: "First" }));
    await repository.create(buildGroup({ name: "Second" }));

    const results = await repository.findAll();

    expect(results).toHaveLength(2);
  });

  it("searches case-insensitively by name", async () => {
    const match = buildGroup({ name: "VIP Customers" });
    const noMatch = buildGroup({ name: "Newsletter Subscribers" });
    await repository.create(match);
    await repository.create(noMatch);

    const results = await repository.findAll("vip");
    expect(results.map((group) => group.id)).toEqual([match.id]);

    const noResults = await repository.findAll("no-such-term");
    expect(noResults).toHaveLength(0);
  });

  it("finds a group by name", async () => {
    const group = buildGroup({ name: "Unique Name" });
    await repository.create(group);

    expect(await repository.findByName("Unique Name")).toEqual(group);
    expect(await repository.findByName("Missing Name")).toBeUndefined();
  });

  it("finds the group currently containing a contact id", async () => {
    const withContact = buildGroup({ contactIds: ["contact-1", "contact-2"] });
    const withoutContact = buildGroup({ contactIds: [] });
    await repository.create(withContact);
    await repository.create(withoutContact);

    expect((await repository.findByContactId("contact-1"))?.id).toBe(withContact.id);
    expect(await repository.findByContactId("no-such-contact")).toBeUndefined();
  });

  it("updates a group's fields, including contactIds", async () => {
    const group = buildGroup({ contactIds: [] });
    await repository.create(group);

    const updated = await repository.update(group.id, { contactIds: ["contact-1"] });

    expect(updated.contactIds).toEqual(["contact-1"]);
    expect((await repository.findById(group.id))?.contactIds).toEqual(["contact-1"]);
  });

  it("deletes a group without affecting unrelated records", async () => {
    const target = buildGroup();
    const other = buildGroup();
    await repository.create(target);
    await repository.create(other);

    await repository.delete(target.id);

    expect(await repository.findById(target.id)).toBeUndefined();
    expect(await repository.findById(other.id)).toEqual(other);
  });
});

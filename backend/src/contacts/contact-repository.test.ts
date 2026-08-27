import type { Contact } from "@email-campaign-v2/contracts";
import type Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { ContactRepository as ContactRepositoryClass } from "./contact-repository";

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

function buildContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: crypto.randomUUID(),
    clientId: `LOCAL-${crypto.randomUUID()}`,
    name: "Ada Lovelace",
    email: `ada-${crypto.randomUUID()}@example.com`,
    branch: "London",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

let sqlite: Database.Database;
let repository: ContactRepositoryClass;

beforeAll(async () => {
  process.env.DATABASE_PATH = ":memory:";
  const clientModule = await import("../db/client");
  sqlite = clientModule.sqlite;
  applyMigrations(sqlite);
  const repositoryModule = await import("./contact-repository");
  repository = repositoryModule.contactRepository;
});

beforeEach(() => {
  sqlite.exec("DELETE FROM contacts");
});

afterAll(() => {
  sqlite.close();
});

describe("ContactRepository", () => {
  it("creates a contact and returns it", async () => {
    const contact = buildContact();

    const created = await repository.create(contact);

    expect(created).toEqual(contact);
    expect(await repository.findById(contact.id)).toEqual(contact);
  });

  it("finds all contacts when no search term is given", async () => {
    const first = buildContact({ name: "First" });
    const second = buildContact({ name: "Second" });
    await repository.create(first);
    await repository.create(second);

    const results = await repository.findAll();

    expect(results).toHaveLength(2);
  });

  it("searches case-insensitively across name, email, and branch", async () => {
    const match = buildContact({ name: "Saraswoti Pandey", email: "saraswoti@example.com", branch: "Kathmandu" });
    const noMatch = buildContact({ name: "Rajesh Shrestha", email: "rajesh@example.com", branch: "Pokhara" });
    await repository.create(match);
    await repository.create(noMatch);

    const byName = await repository.findAll("SARASWOTI");
    expect(byName.map((c) => c.id)).toEqual([match.id]);

    const byEmail = await repository.findAll("saraswoti@EXAMPLE");
    expect(byEmail.map((c) => c.id)).toEqual([match.id]);

    const byBranch = await repository.findAll("kathmandu");
    expect(byBranch.map((c) => c.id)).toEqual([match.id]);

    const noResults = await repository.findAll("no-such-term");
    expect(noResults).toHaveLength(0);
  });

  it("finds a contact by email", async () => {
    const contact = buildContact({ email: "unique@example.com" });
    await repository.create(contact);

    expect(await repository.findByEmail("unique@example.com")).toEqual(contact);
    expect(await repository.findByEmail("missing@example.com")).toBeUndefined();
  });

  it("updates a contact's fields", async () => {
    const contact = buildContact({ branch: "Old Branch" });
    await repository.create(contact);

    const updated = await repository.update(contact.id, { branch: "New Branch" });

    expect(updated.branch).toBe("New Branch");
    expect((await repository.findById(contact.id))?.branch).toBe("New Branch");
  });

  it("deletes a contact without affecting unrelated records", async () => {
    const target = buildContact();
    const other = buildContact();
    await repository.create(target);
    await repository.create(other);

    await repository.delete(target.id);

    expect(await repository.findById(target.id)).toBeUndefined();
    expect(await repository.findById(other.id)).toEqual(other);
  });

  describe("findPage", () => {
    it("returns the requested page slice and the total matching count", async () => {
      for (let i = 0; i < 5; i += 1) {
        await repository.create(buildContact({ name: `Contact ${i}`, createdAt: `2026-01-0${i + 1}T00:00:00.000Z` }));
      }

      const firstPage = await repository.findPage({ page: 1, pageSize: 2 });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.total).toBe(5);

      const secondPage = await repository.findPage({ page: 2, pageSize: 2 });
      expect(secondPage.data).toHaveLength(2);
      expect(secondPage.total).toBe(5);

      const thirdPage = await repository.findPage({ page: 3, pageSize: 2 });
      expect(thirdPage.data).toHaveLength(1);
      expect(thirdPage.total).toBe(5);
    });

    it("applies pagination after the search filter", async () => {
      const match = buildContact({ name: "Findable One", branch: "Kathmandu" });
      const otherMatch = buildContact({ name: "Findable Two", branch: "Kathmandu" });
      const noMatch = buildContact({ name: "Excluded", branch: "Pokhara" });
      await repository.create(match);
      await repository.create(otherMatch);
      await repository.create(noMatch);

      const page = await repository.findPage({ search: "findable", page: 1, pageSize: 10 });

      expect(page.total).toBe(2);
      expect(page.data.map((c) => c.id).sort()).toEqual([match.id, otherMatch.id].sort());
    });

    it("returns an empty data array, not an error, for a page beyond the available results", async () => {
      await repository.create(buildContact());

      const page = await repository.findPage({ page: 5, pageSize: 10 });

      expect(page.data).toEqual([]);
      expect(page.total).toBe(1);
    });
  });
});

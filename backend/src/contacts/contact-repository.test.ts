import { existsSync, rmSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Contact } from "@email-campaign-v2/contracts";

import type { ContactRepository as ContactRepositoryClass } from "./contact-repository";

const TEST_DB_PATH = "data/contact-repository.test.db";

let ContactRepository: typeof ContactRepositoryClass;

beforeAll(async () => {
  process.env.DATABASE_PATH = TEST_DB_PATH;
  ({ ContactRepository } = await import("./contact-repository"));
});

afterAll(() => {
  for (const suffix of ["", "-shm", "-wal"]) {
    const path = `${TEST_DB_PATH}${suffix}`;
    if (existsSync(path)) rmSync(path);
  }
});

function buildContact(overrides: Partial<Contact> = {}): Contact {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    clientId: `LOCAL-${crypto.randomUUID().slice(0, 8)}`,
    name: "Ada Lovelace",
    email: `ada-${crypto.randomUUID()}@example.com`,
    branch: "London",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("ContactRepository.findByIds (T8)", () => {
  it("returns only matching contacts and excludes unknown ids", async () => {
    const repository = new ContactRepository();
    const first = await repository.create(buildContact());
    const second = await repository.create(buildContact());
    await repository.create(buildContact());

    const results = await repository.findByIds([first.id, second.id, "unknown-id"]);

    expect(results).toHaveLength(2);
    expect(results.map((row) => row.id).sort()).toEqual([first.id, second.id].sort());
  });

  it("returns an empty array when given no ids", async () => {
    const repository = new ContactRepository();
    const results = await repository.findByIds([]);
    expect(results).toEqual([]);
  });

  it("does not change findAll, findById, findByEmail, create, update, delete behavior", async () => {
    const repository = new ContactRepository();
    const created = await repository.create(buildContact({ branch: "Boston" }));

    expect(await repository.findById(created.id)).toMatchObject({ id: created.id });
    expect(await repository.findByEmail(created.email)).toMatchObject({ id: created.id });

    const updated = await repository.update(created.id, { branch: "Cambridge" });
    expect(updated?.branch).toBe("Cambridge");

    const all = await repository.findAll();
    expect(all.some((row) => row.id === created.id)).toBe(true);

    await repository.delete(created.id);
    expect(await repository.findById(created.id)).toBeUndefined();
  });
});

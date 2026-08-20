import { existsSync, rmSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Contact } from "@email-campaign-v2/contracts";

import type { ContactRepository as ContactRepositoryClass } from "../contacts/contact-repository";
import type { GroupRepository as GroupRepositoryClass, GroupRow } from "./group-repository";

const TEST_DB_PATH = "data/group-repository.test.db";

let GroupRepository: typeof GroupRepositoryClass;
let ContactRepository: typeof ContactRepositoryClass;

beforeAll(async () => {
  process.env.DATABASE_PATH = TEST_DB_PATH;
  ({ GroupRepository } = await import("./group-repository"));
  ({ ContactRepository } = await import("../contacts/contact-repository"));
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

afterAll(() => {
  for (const suffix of ["", "-shm", "-wal"]) {
    const path = `${TEST_DB_PATH}${suffix}`;
    if (existsSync(path)) rmSync(path);
  }
});

function buildGroupRow(overrides: Partial<GroupRow> = {}): GroupRow {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: `Group ${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("GroupRepository.findByIds (P1-4)", () => {
  it("returns only matching groups and excludes unknown ids", async () => {
    const repository = new GroupRepository();
    const first = await repository.create(buildGroupRow());
    const second = await repository.create(buildGroupRow());
    await repository.create(buildGroupRow());

    const results = await repository.findByIds([first.id, second.id, "unknown-id"]);

    expect(results).toHaveLength(2);
    expect(results.map((row) => row.id).sort()).toEqual([first.id, second.id].sort());
  });

  it("returns an empty array when given no ids", async () => {
    const repository = new GroupRepository();
    const results = await repository.findByIds([]);
    expect(results).toEqual([]);
  });
});

describe("GroupRepository.findContactIdsForGroups (P1-4)", () => {
  it("returns the union of contact ids across multiple groups, with duplicates left for the caller to dedupe", async () => {
    const repository = new GroupRepository();
    const contactRepository = new ContactRepository();
    const contact1 = await contactRepository.create(buildContact());
    const contact2 = await contactRepository.create(buildContact());
    const contact3 = await contactRepository.create(buildContact());
    const groupA = await repository.create(buildGroupRow());
    const groupB = await repository.create(buildGroupRow());
    await repository.addContacts(groupA.id, [contact1.id, contact2.id]);
    await repository.addContacts(groupB.id, [contact2.id, contact3.id]);

    const contactIds = await repository.findContactIdsForGroups([groupA.id, groupB.id]);

    expect(contactIds.sort()).toEqual([contact1.id, contact2.id, contact2.id, contact3.id].sort());
  });

  it("returns an empty array when given no group ids", async () => {
    const repository = new GroupRepository();
    const contactIds = await repository.findContactIdsForGroups([]);
    expect(contactIds).toEqual([]);
  });
});

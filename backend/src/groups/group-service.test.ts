import { describe, expect, it } from "vitest";
import type { Contact } from "@email-campaign-v2/contracts";

import type { ContactRepository } from "../contacts/contact-repository";
import { ConflictError, NotFoundError, ValidationError } from "./group-errors";
import { GroupService } from "./group-service";
import type { GroupRepository, GroupRow } from "./group-repository";

function createFakeContactRepository(seed: Contact[] = []): ContactRepository {
  const rows = [...seed];

  return {
    async findByIds(ids: string[]) {
      return rows.filter((row) => ids.includes(row.id));
    },
  } as unknown as ContactRepository;
}

function buildContact(overrides: Partial<Contact> = {}): Contact {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    clientId: `LOCAL-${crypto.randomUUID().slice(0, 8)}`,
    name: "Ada Lovelace",
    email: "ada@example.com",
    branch: "London",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createFakeGroupRepository(seed: GroupRow[] = []): GroupRepository {
  const rows = [...seed];
  const membership = new Map<string, Set<string>>();

  return {
    async findAll(search?: string) {
      if (!search) return [...rows];
      const term = search.toLowerCase();
      return rows.filter((row) => row.name.toLowerCase().includes(term));
    },
    async findById(id: string) {
      return rows.find((row) => row.id === id);
    },
    async findByName(name: string, excludeId?: string) {
      return rows.find((row) => row.name.toLowerCase() === name.toLowerCase() && row.id !== excludeId);
    },
    async create(row: GroupRow) {
      rows.push(row);
      membership.set(row.id, new Set());
      return row;
    },
    async update(id: string, changes: Partial<Omit<GroupRow, "id">>) {
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) return undefined;
      rows[index] = { ...rows[index], ...changes };
      return rows[index];
    },
    async delete(id: string) {
      const index = rows.findIndex((row) => row.id === id);
      if (index !== -1) rows.splice(index, 1);
      membership.delete(id);
    },
    async addContacts(groupId: string, contactIds: string[]) {
      const set = membership.get(groupId) ?? new Set<string>();
      for (const id of contactIds) set.add(id);
      membership.set(groupId, set);
    },
    async removeContacts(groupId: string, contactIds: string[]) {
      const set = membership.get(groupId);
      if (!set) return;
      for (const id of contactIds) set.delete(id);
    },
    async countContacts(groupId: string) {
      return membership.get(groupId)?.size ?? 0;
    },
    async findContactIds(groupId: string) {
      return [...(membership.get(groupId) ?? new Set())];
    },
  } as unknown as GroupRepository;
}

function buildGroupRow(overrides: Partial<GroupRow> = {}): GroupRow {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "Newsletter Subscribers",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("GroupService.createGroup (T1)", () => {
  it("rejects a duplicate group name", async () => {
    const groupRepository = createFakeGroupRepository([buildGroupRow({ name: "VIP" })]);
    const service = new GroupService(groupRepository, createFakeContactRepository());

    await expect(service.createGroup({ name: "VIP" })).rejects.toThrow(ConflictError);
  });

  it("rejects contactIds that do not exist", async () => {
    const groupRepository = createFakeGroupRepository();
    const service = new GroupService(groupRepository, createFakeContactRepository([]));

    await expect(service.createGroup({ name: "New Group", contactIds: ["missing"] })).rejects.toThrow(ValidationError);
  });
});

describe("GroupService.createGroup (T2)", () => {
  it("prevents duplicate contacts within the created group", async () => {
    const contact = buildContact({ id: "c1" });
    const groupRepository = createFakeGroupRepository();
    const service = new GroupService(groupRepository, createFakeContactRepository([contact]));

    const group = await service.createGroup({ name: "Dup Test", contactIds: ["c1", "c1"] });

    expect(group.contactCount).toBe(1);
  });
});

describe("GroupService.updateGroup (T3)", () => {
  it("enforces name uniqueness excluding the record being updated", async () => {
    const target = buildGroupRow({ id: "g1", name: "Alpha" });
    const other = buildGroupRow({ id: "g2", name: "Beta" });
    const groupRepository = createFakeGroupRepository([target, other]);
    const service = new GroupService(groupRepository, createFakeContactRepository());

    await expect(service.updateGroup("g1", { name: "Alpha" })).resolves.toBeTruthy();
    await expect(service.updateGroup("g1", { name: "Beta" })).rejects.toThrow(ConflictError);
  });

  it("throws NotFoundError when updating a group that does not exist", async () => {
    const service = new GroupService(createFakeGroupRepository(), createFakeContactRepository());

    await expect(service.updateGroup("missing", { name: "X" })).rejects.toThrow(NotFoundError);
  });
});

describe("GroupService.updateGroup (T4)", () => {
  it("validates addContactIds and applies add/remove membership changes", async () => {
    const group = buildGroupRow({ id: "g1" });
    const contactA = buildContact({ id: "c1" });
    const contactB = buildContact({ id: "c2" });
    const groupRepository = createFakeGroupRepository([group]);
    const service = new GroupService(groupRepository, createFakeContactRepository([contactA, contactB]));

    await service.updateGroup("g1", { addContactIds: ["c1", "c2"] });
    const updated = await service.updateGroup("g1", { removeContactIds: ["c1"] });

    expect(updated.contactCount).toBe(1);
    expect(updated.contactIds).toEqual(["c2"]);
  });

  it("rejects unknown addContactIds", async () => {
    const group = buildGroupRow({ id: "g1" });
    const groupRepository = createFakeGroupRepository([group]);
    const service = new GroupService(groupRepository, createFakeContactRepository([]));

    await expect(service.updateGroup("g1", { addContactIds: ["missing"] })).rejects.toThrow(ValidationError);
  });
});

describe("GroupService.deleteGroup (T5)", () => {
  it("removes the group and its membership rows without deleting member contacts", async () => {
    const group = buildGroupRow({ id: "g1" });
    const groupRepository = createFakeGroupRepository([group]);
    const contactRepository = createFakeContactRepository([buildContact({ id: "c1" })]);
    const service = new GroupService(groupRepository, contactRepository);

    await service.updateGroup("g1", { addContactIds: ["c1"] });
    await service.deleteGroup("g1");

    await expect(service.updateGroup("g1", { name: "X" })).rejects.toThrow(NotFoundError);
    await expect(contactRepository.findByIds(["c1"])).resolves.toHaveLength(1);
  });

  it("throws NotFoundError when deleting a group that does not exist", async () => {
    const service = new GroupService(createFakeGroupRepository(), createFakeContactRepository());

    await expect(service.deleteGroup("missing")).rejects.toThrow(NotFoundError);
  });
});

describe("GroupService.getGroups (T6)", () => {
  it("performs a case-insensitive search by name and returns the correct contactCount per group", async () => {
    const contact = buildContact({ id: "c1" });
    const groupRepository = createFakeGroupRepository([
      buildGroupRow({ id: "g1", name: "Newsletter Subscribers" }),
      buildGroupRow({ id: "g2", name: "VIP Customers" }),
    ]);
    const service = new GroupService(groupRepository, createFakeContactRepository([contact]));

    await service.updateGroup("g1", { addContactIds: ["c1"] });

    await expect(service.getGroups("NEWSLETTER")).resolves.toEqual([
      expect.objectContaining({ id: "g1", contactCount: 1 }),
    ]);
    await expect(service.getGroups()).resolves.toHaveLength(2);
  });
});

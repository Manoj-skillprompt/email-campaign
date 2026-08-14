import { describe, expect, it } from "vitest";
import type { Contact } from "@email-campaign-v2/contracts";

import { ConflictError, NotFoundError } from "./contact-errors";
import { ContactService } from "./contact-service";
import type { ContactRepository } from "./contact-repository";

function createFakeRepository(seed: Contact[] = []): ContactRepository {
  const rows = [...seed];

  return {
    async findAll(search?: string) {
      if (!search) return [...rows];
      const term = search.toLowerCase();
      return rows.filter(
        (row) =>
          row.name.toLowerCase().includes(term) ||
          row.email.toLowerCase().includes(term) ||
          row.branch.toLowerCase().includes(term)
      );
    },
    async findById(id: string) {
      return rows.find((row) => row.id === id);
    },
    async findByEmail(email: string, excludeId?: string) {
      return rows.find((row) => row.email.toLowerCase() === email.toLowerCase() && row.id !== excludeId);
    },
    async create(contact: Contact) {
      rows.push(contact);
      return contact;
    },
    async update(id: string, changes: Partial<Omit<Contact, "id">>) {
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) return undefined;
      rows[index] = { ...rows[index], ...changes };
      return rows[index];
    },
    async delete(id: string) {
      const index = rows.findIndex((row) => row.id === id);
      if (index !== -1) rows.splice(index, 1);
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

describe("ContactService.createContact (T1)", () => {
  it("generates a unique clientId in the LOCAL-<uuid> format", async () => {
    const service = new ContactService(createFakeRepository());

    const contact = await service.createContact({
      name: "Grace Hopper",
      email: "grace@example.com",
      branch: "Boston",
    });

    expect(contact.clientId).toMatch(/^LOCAL-[0-9a-f]{8}$/);
    expect(contact.id).toBeTruthy();
  });

  it("rejects creation when the email already exists", async () => {
    const repository = createFakeRepository([buildContact({ email: "ada@example.com" })]);
    const service = new ContactService(repository);

    await expect(
      service.createContact({ name: "Someone Else", email: "ada@example.com", branch: "NYC" })
    ).rejects.toThrow(ConflictError);
  });

  it("treats email uniqueness as case-insensitive", async () => {
    const repository = createFakeRepository([buildContact({ email: "ada@example.com" })]);
    const service = new ContactService(repository);

    await expect(
      service.createContact({ name: "Someone Else", email: "ADA@EXAMPLE.COM", branch: "NYC" })
    ).rejects.toThrow(ConflictError);
  });
});

describe("ContactService.updateContact (T2)", () => {
  it("allows updating a contact while keeping its own email", async () => {
    const existing = buildContact({ email: "ada@example.com" });
    const repository = createFakeRepository([existing]);
    const service = new ContactService(repository);

    const updated = await service.updateContact(existing.id, {
      email: "ada@example.com",
      branch: "Cambridge",
    });

    expect(updated.branch).toBe("Cambridge");
  });

  it("rejects updating to an email already used by a different contact", async () => {
    const target = buildContact({ id: "contact-1", email: "ada@example.com" });
    const other = buildContact({ id: "contact-2", email: "grace@example.com" });
    const repository = createFakeRepository([target, other]);
    const service = new ContactService(repository);

    await expect(service.updateContact(target.id, { email: "grace@example.com" })).rejects.toThrow(ConflictError);
  });

  it("throws NotFoundError when updating a contact that does not exist", async () => {
    const service = new ContactService(createFakeRepository());

    await expect(service.updateContact("missing-id", { branch: "X" })).rejects.toThrow(NotFoundError);
  });
});

describe("ContactService.deleteContact (T3)", () => {
  it("permanently removes the contact", async () => {
    const existing = buildContact();
    const repository = createFakeRepository([existing]);
    const service = new ContactService(repository);

    await service.deleteContact(existing.id);

    const remaining = await repository.findAll();
    expect(remaining).toHaveLength(0);
  });

  it("throws NotFoundError when deleting a contact that does not exist", async () => {
    const service = new ContactService(createFakeRepository());

    await expect(service.deleteContact("missing-id")).rejects.toThrow(NotFoundError);
  });
});

describe("ContactService.getContacts (T4)", () => {
  it("performs a case-insensitive search across name, email, and branch", async () => {
    const repository = createFakeRepository([
      buildContact({ id: "1", name: "Ada Lovelace", email: "ada@example.com", branch: "London" }),
      buildContact({
        id: "2",
        name: "Grace Hopper",
        email: "grace@example.com",
        branch: "Boston",
      }),
    ]);
    const service = new ContactService(repository);

    await expect(service.getContacts("LOVELACE")).resolves.toEqual([expect.objectContaining({ id: "1" })]);
    await expect(service.getContacts("grace@example")).resolves.toEqual([expect.objectContaining({ id: "2" })]);
    await expect(service.getContacts("BOSTON")).resolves.toEqual([expect.objectContaining({ id: "2" })]);
  });

  it("returns all contacts when no search term is provided", async () => {
    const repository = createFakeRepository([buildContact({ id: "1" }), buildContact({ id: "2" })]);
    const service = new ContactService(repository);

    await expect(service.getContacts()).resolves.toHaveLength(2);
  });
});

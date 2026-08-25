import type { Contact } from "@email-campaign-v2/contracts";
import { describe, expect, it } from "vitest";

import { ContactNotFoundError, DuplicateEmailError } from "./contact-errors";
import type { ContactRepository } from "./contact-repository";
import { ContactService } from "./contact-service";

function buildContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    clientId: "LOCAL-existing",
    name: "Existing Contact",
    email: "existing@example.com",
    branch: "Existing Branch",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createFakeRepository(initialContacts: Contact[] = []): ContactRepository {
  let contacts = [...initialContacts];

  return {
    async create(contact) {
      contacts = [...contacts, contact];
      return contact;
    },
    async findAll() {
      return contacts;
    },
    async findById(id) {
      return contacts.find((contact) => contact.id === id);
    },
    async findByEmail(email) {
      return contacts.find((contact) => contact.email === email);
    },
    async update(id, changes) {
      const existing = contacts.find((contact) => contact.id === id);
      if (!existing) {
        throw new Error(`Contact with id "${id}" was not found after update.`);
      }
      const updated = { ...existing, ...changes } as Contact;
      contacts = contacts.map((contact) => (contact.id === id ? updated : contact));
      return updated;
    },
    async delete(id) {
      contacts = contacts.filter((contact) => contact.id !== id);
    },
  } as ContactRepository;
}

describe("ContactService", () => {
  describe("createContact", () => {
    it("generates a clientId in LOCAL-<uuid> format and persists the contact", async () => {
      const service = new ContactService(createFakeRepository());

      const created = await service.createContact({
        name: "Ada Lovelace",
        email: "ada@example.com",
        branch: "London",
      });

      expect(created.clientId).toMatch(/^LOCAL-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(created.id).toBeTruthy();
      expect(created.createdAt).toBe(created.updatedAt);
      expect(created.name).toBe("Ada Lovelace");
    });

    it("rejects a duplicate email with DuplicateEmailError", async () => {
      const existing = buildContact({ email: "taken@example.com" });
      const service = new ContactService(createFakeRepository([existing]));

      await expect(
        service.createContact({ name: "New Person", email: "taken@example.com", branch: "Anywhere" })
      ).rejects.toThrow(DuplicateEmailError);
    });
  });

  describe("updateContact", () => {
    it("rejects changing the email to one already used by another contact", async () => {
      const target = buildContact({ id: "target-id", email: "target@example.com" });
      const other = buildContact({ id: "other-id", email: "other@example.com" });
      const service = new ContactService(createFakeRepository([target, other]));

      await expect(service.updateContact("target-id", { email: "other@example.com" })).rejects.toThrow(
        DuplicateEmailError
      );
    });

    it("allows keeping the same email on update", async () => {
      const target = buildContact({ id: "target-id", email: "target@example.com" });
      const service = new ContactService(createFakeRepository([target]));

      const updated = await service.updateContact("target-id", { email: "target@example.com", branch: "New Branch" });

      expect(updated.branch).toBe("New Branch");
    });

    it("throws ContactNotFoundError when the contact does not exist", async () => {
      const service = new ContactService(createFakeRepository([]));

      await expect(service.updateContact("missing-id", { branch: "X" })).rejects.toThrow(ContactNotFoundError);
    });
  });

  describe("deleteContact", () => {
    it("removes only the targeted contact and leaves unrelated records untouched", async () => {
      const target = buildContact({ id: "target-id", email: "target@example.com" });
      const other = buildContact({ id: "other-id", email: "other@example.com" });
      const repository = createFakeRepository([target, other]);
      const service = new ContactService(repository);

      await service.deleteContact("target-id");

      const remaining = await repository.findAll();
      expect(remaining).toHaveLength(1);
      expect(remaining[0]?.id).toBe("other-id");
    });

    it("throws ContactNotFoundError when the contact does not exist", async () => {
      const service = new ContactService(createFakeRepository([]));

      await expect(service.deleteContact("missing-id")).rejects.toThrow(ContactNotFoundError);
    });
  });
});

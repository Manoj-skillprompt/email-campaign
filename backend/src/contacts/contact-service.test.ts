import type { Contact } from "@email-campaign-v2/contracts";
import { describe, expect, it } from "vitest";

import { ContactNotFoundError, DuplicateEmailError } from "./contact-errors";
import type { ContactRepository } from "./contact-repository";
import { ContactService, generateUniqueClientId } from "./contact-service";

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
    async findPage({ search, page, pageSize }) {
      const matching = search
        ? contacts.filter((contact) =>
            [contact.name, contact.email, contact.branch].some((field) =>
              field.toLowerCase().includes(search.toLowerCase())
            )
          )
        : contacts;
      const start = (page - 1) * pageSize;
      return { data: matching.slice(start, start + pageSize), total: matching.length };
    },
  } as ContactRepository;
}

describe("ContactService", () => {
  describe("createContact", () => {
    it("generates a random 4-digit clientId and persists the contact", async () => {
      const service = new ContactService(createFakeRepository());

      const created = await service.createContact({
        name: "Ada Lovelace",
        email: "ada@example.com",
        branch: "London",
      });

      expect(created.clientId).toMatch(/^\d{4}$/);
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

  describe("generateUniqueClientId", () => {
    it("retries generation when the random value collides with an already-used clientId", () => {
      const usedClientIds = new Set(["1234"]);
      const values = [1234, 5678];
      const randomFn = () => values.shift()!;

      expect(generateUniqueClientId(usedClientIds, randomFn)).toBe("5678");
    });

    it("pads single-digit values to 4 digits", () => {
      expect(generateUniqueClientId(new Set(), () => 7)).toBe("0007");
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

  describe("getContactById", () => {
    it("returns the contact when it exists", async () => {
      const target = buildContact({ id: "target-id" });
      const service = new ContactService(createFakeRepository([target]));

      const found = await service.getContactById("target-id");

      expect(found?.id).toBe("target-id");
    });

    it("returns undefined when the contact does not exist", async () => {
      const service = new ContactService(createFakeRepository([]));

      const found = await service.getContactById("missing-id");

      expect(found).toBeUndefined();
    });
  });

  describe("listContacts", () => {
    it("computes totalPages from the repository's total count and requested pageSize", async () => {
      const contacts = Array.from({ length: 5 }, (_, i) => buildContact({ id: `id-${i}`, email: `c${i}@example.com` }));
      const service = new ContactService(createFakeRepository(contacts));

      const result = await service.listContacts({ page: 1, pageSize: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
    });

    it("reports totalPages 0 when there are no matching contacts", async () => {
      const service = new ContactService(createFakeRepository([]));

      const result = await service.listContacts({ page: 1, pageSize: 10 });

      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
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

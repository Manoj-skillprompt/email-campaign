import type { Contact, Group } from "@email-campaign-v2/contracts";
import { describe, expect, it } from "vitest";

import { ContactNotFoundError } from "../contacts/contact-errors";
import type { ContactRepository } from "../contacts/contact-repository";
import { ContactService } from "../contacts/contact-service";
import { DuplicateGroupNameError, GroupNotFoundError } from "./group-errors";
import type { GroupRepository } from "./group-repository";
import { GroupService } from "./group-service";

function buildGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Existing Group",
    contactIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function buildContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "contact-1",
    clientId: "LOCAL-contact-1",
    name: "Existing Contact",
    email: "existing@example.com",
    branch: "Existing Branch",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createFakeGroupRepository(initialGroups: Group[] = []): GroupRepository {
  let groups = [...initialGroups];

  return {
    async create(group) {
      groups = [...groups, group];
      return group;
    },
    async findAll() {
      return groups;
    },
    async findById(id) {
      return groups.find((group) => group.id === id);
    },
    async findByName(name) {
      return groups.find((group) => group.name === name);
    },
    async findByContactId(contactId) {
      return groups.find((group) => group.contactIds.includes(contactId));
    },
    async update(id, changes) {
      const existing = groups.find((group) => group.id === id);
      if (!existing) {
        throw new Error(`Group with id "${id}" was not found after update.`);
      }
      const updated = { ...existing, ...changes } as Group;
      groups = groups.map((group) => (group.id === id ? updated : group));
      return updated;
    },
    async delete(id) {
      groups = groups.filter((group) => group.id !== id);
    },
  } as GroupRepository;
}

function createFakeContactRepository(initialContacts: Contact[] = []): ContactRepository {
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

function buildService(groups: Group[] = [], contacts: Contact[] = []) {
  return new GroupService(createFakeGroupRepository(groups), new ContactService(createFakeContactRepository(contacts)));
}

describe("GroupService", () => {
  describe("createGroup", () => {
    it("creates a group with an empty contactIds list", async () => {
      const service = buildService();

      const created = await service.createGroup({ name: "New Group" });

      expect(created.name).toBe("New Group");
      expect(created.contactIds).toEqual([]);
      expect(created.createdAt).toBe(created.updatedAt);
    });

    it("rejects a duplicate name with DuplicateGroupNameError", async () => {
      const service = buildService([buildGroup({ name: "Taken" })]);

      await expect(service.createGroup({ name: "Taken" })).rejects.toThrow(DuplicateGroupNameError);
    });
  });

  describe("updateGroup", () => {
    it("rejects renaming to a name already used by another group", async () => {
      const target = buildGroup({ id: "target-id", name: "Target" });
      const other = buildGroup({ id: "other-id", name: "Other" });
      const service = buildService([target, other]);

      await expect(service.updateGroup("target-id", { name: "Other" })).rejects.toThrow(DuplicateGroupNameError);
    });

    it("allows keeping the same name", async () => {
      const target = buildGroup({ id: "target-id", name: "Target" });
      const service = buildService([target]);

      const updated = await service.updateGroup("target-id", { name: "Target" });

      expect(updated.name).toBe("Target");
    });

    it("throws GroupNotFoundError when the group does not exist", async () => {
      const service = buildService();

      await expect(service.updateGroup("missing-id", { name: "X" })).rejects.toThrow(GroupNotFoundError);
    });
  });

  describe("getGroupById", () => {
    it("returns the group when it exists", async () => {
      const target = buildGroup({ id: "target-id" });
      const service = buildService([target]);

      const found = await service.getGroupById("target-id");

      expect(found?.id).toBe("target-id");
    });

    it("returns undefined when the group does not exist", async () => {
      const service = buildService();

      const found = await service.getGroupById("missing-id");

      expect(found).toBeUndefined();
    });
  });

  describe("deleteGroup", () => {
    it("removes the group", async () => {
      const target = buildGroup({ id: "target-id" });
      const groupRepository = createFakeGroupRepository([target]);
      const service = new GroupService(groupRepository, new ContactService(createFakeContactRepository()));

      await service.deleteGroup("target-id");

      expect(await groupRepository.findById("target-id")).toBeUndefined();
    });

    it("throws GroupNotFoundError when the group does not exist", async () => {
      const service = buildService();

      await expect(service.deleteGroup("missing-id")).rejects.toThrow(GroupNotFoundError);
    });
  });

  describe("assignContactToGroup", () => {
    it("moves a contact already in another group into the target group", async () => {
      const contact = buildContact({ id: "contact-1" });
      const sourceGroup = buildGroup({ id: "source-id", name: "Source", contactIds: ["contact-1"] });
      const targetGroup = buildGroup({ id: "target-id", name: "Target", contactIds: [] });
      const groupRepository = createFakeGroupRepository([sourceGroup, targetGroup]);
      const service = new GroupService(groupRepository, new ContactService(createFakeContactRepository([contact])));

      const result = await service.assignContactToGroup("target-id", "contact-1");

      expect(result.contactIds).toEqual(["contact-1"]);
      expect((await groupRepository.findById("source-id"))?.contactIds).toEqual([]);
    });

    it("throws GroupNotFoundError when the target group does not exist", async () => {
      const service = buildService([], [buildContact({ id: "contact-1" })]);

      await expect(service.assignContactToGroup("missing-id", "contact-1")).rejects.toThrow(GroupNotFoundError);
    });

    it("throws ContactNotFoundError when the contact does not exist", async () => {
      const service = buildService([buildGroup({ id: "target-id" })], []);

      await expect(service.assignContactToGroup("target-id", "missing-contact")).rejects.toThrow(ContactNotFoundError);
    });

    it("is idempotent when assigning a contact already in the target group", async () => {
      const contact = buildContact({ id: "contact-1" });
      const targetGroup = buildGroup({ id: "target-id", contactIds: ["contact-1"] });
      const service = buildService([targetGroup], [contact]);

      const result = await service.assignContactToGroup("target-id", "contact-1");

      expect(result.contactIds).toEqual(["contact-1"]);
    });
  });

  describe("unassignContactFromGroup", () => {
    it("removes the contact id from the group without deleting the contact", async () => {
      const targetGroup = buildGroup({ id: "target-id", contactIds: ["contact-1", "contact-2"] });
      const contactRepository = createFakeContactRepository([buildContact({ id: "contact-1" })]);
      const groupRepository = createFakeGroupRepository([targetGroup]);
      const service = new GroupService(groupRepository, new ContactService(contactRepository));

      const result = await service.unassignContactFromGroup("target-id", "contact-1");

      expect(result.contactIds).toEqual(["contact-2"]);
      expect(await contactRepository.findById("contact-1")).toBeDefined();
    });

    it("throws GroupNotFoundError when the group does not exist", async () => {
      const service = buildService();

      await expect(service.unassignContactFromGroup("missing-id", "contact-1")).rejects.toThrow(GroupNotFoundError);
    });
  });
});

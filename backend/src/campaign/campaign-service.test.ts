import type { Campaign, Contact, Group } from "@email-campaign-v2/contracts";
import { describe, expect, it } from "vitest";

import type { ContactRepository } from "../contacts/contact-repository";
import { ContactService } from "../contacts/contact-service";
import { GroupNotFoundError } from "../groups/group-errors";
import type { GroupRepository } from "../groups/group-repository";
import { GroupService } from "../groups/group-service";
import { CampaignAlreadySentError, CampaignNotFoundError, CampaignValidationError } from "./campaign-errors";
import type { CampaignRepository } from "./campaign-repository";
import { CampaignService } from "./campaign-service";
import type { EmailSender, SendEmailInput } from "./email-sender";

function buildCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: "campaign-1",
    name: "Test Campaign",
    subject: "Subject",
    senderEmail: "info@skillprompt.com",
    type: "EMAIL",
    groupIds: [],
    content: "Body",
    status: "DRAFT",
    scheduledAt: null,
    sentAt: null,
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function buildGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: "group-1",
    name: "Group",
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
    name: "Contact",
    email: "contact@example.com",
    branch: "Branch",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createFakeCampaignRepository(initial: Campaign[] = []): CampaignRepository {
  let campaigns = [...initial];

  return {
    async create(campaign) {
      campaigns = [...campaigns, campaign];
      return campaign;
    },
    async findAll() {
      return campaigns;
    },
    async findById(id) {
      return campaigns.find((campaign) => campaign.id === id);
    },
    async update(id, changes) {
      const existing = campaigns.find((campaign) => campaign.id === id);
      if (!existing) {
        throw new Error(`Campaign with id "${id}" was not found after update.`);
      }
      const updated = { ...existing, ...changes } as Campaign;
      campaigns = campaigns.map((campaign) => (campaign.id === id ? updated : campaign));
      return updated;
    },
    async delete(id) {
      campaigns = campaigns.filter((campaign) => campaign.id !== id);
    },
  } as CampaignRepository;
}

function createFakeGroupRepository(initial: Group[] = []): GroupRepository {
  let groups = [...initial];

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

function createFakeContactRepository(initial: Contact[] = []): ContactRepository {
  let contacts = [...initial];

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

function createFakeEmailSender(): EmailSender & { sent: SendEmailInput[] } {
  const sent: SendEmailInput[] = [];
  return {
    sent,
    async sendEmail(input) {
      sent.push(input);
    },
  };
}

function buildService(
  options: {
    campaigns?: Campaign[];
    groups?: Group[];
    contacts?: Contact[];
    emailSender?: EmailSender;
  } = {}
) {
  const campaignRepository = createFakeCampaignRepository(options.campaigns);
  const groupService = new GroupService(
    createFakeGroupRepository(options.groups),
    new ContactService(createFakeContactRepository(options.contacts))
  );
  const contactService = new ContactService(createFakeContactRepository(options.contacts));
  const emailSender = options.emailSender ?? createFakeEmailSender();
  const service = new CampaignService(campaignRepository, groupService, contactService, emailSender);
  return { service, campaignRepository };
}

describe("CampaignService", () => {
  describe("createCampaign", () => {
    it("creates a DRAFT campaign with zeroed metrics and defaults", async () => {
      const { service } = buildService();

      const created = await service.createCampaign({ name: "New Campaign" });

      expect(created.status).toBe("DRAFT");
      expect(created.type).toBe("EMAIL");
      expect(created.groupIds).toEqual([]);
      expect(created.sentCount).toBe(0);
      expect(created.openRate).toBe(0);
      expect(created.clickRate).toBe(0);
      expect(created.scheduledAt).toBeNull();
      expect(created.sentAt).toBeNull();
    });
  });

  describe("updateCampaign", () => {
    it("throws CampaignNotFoundError when the campaign does not exist", async () => {
      const { service } = buildService();

      await expect(service.updateCampaign("missing-id", { name: "X" })).rejects.toThrow(CampaignNotFoundError);
    });

    it("throws CampaignAlreadySentError for a sent campaign", async () => {
      const sent = buildCampaign({ id: "sent-id", status: "SENT" });
      const { service } = buildService({ campaigns: [sent] });

      await expect(service.updateCampaign("sent-id", { name: "X" })).rejects.toThrow(CampaignAlreadySentError);
    });

    it("updates fields on a draft campaign", async () => {
      const draft = buildCampaign({ id: "draft-id", status: "DRAFT" });
      const { service } = buildService({ campaigns: [draft] });

      const updated = await service.updateCampaign("draft-id", { subject: "New Subject" });

      expect(updated.subject).toBe("New Subject");
    });
  });

  describe("scheduleCampaign", () => {
    it("rejects an incomplete campaign with CampaignValidationError", async () => {
      const incomplete = buildCampaign({ id: "incomplete-id", subject: "", groupIds: [] });
      const { service } = buildService({ campaigns: [incomplete] });

      await expect(service.scheduleCampaign("incomplete-id", "2026-12-25T00:00:00.000Z")).rejects.toThrow(
        CampaignValidationError
      );
    });

    it("rejects an already-sent campaign", async () => {
      const sent = buildCampaign({ id: "sent-id", status: "SENT" });
      const { service } = buildService({ campaigns: [sent] });

      await expect(service.scheduleCampaign("sent-id", "2026-12-25T00:00:00.000Z")).rejects.toThrow(
        CampaignAlreadySentError
      );
    });

    it("sets status SCHEDULED and scheduledAt for a complete campaign", async () => {
      const complete = buildCampaign({ id: "complete-id", groupIds: ["group-1"] });
      const { service } = buildService({ campaigns: [complete], groups: [buildGroup({ id: "group-1" })] });

      const scheduled = await service.scheduleCampaign("complete-id", "2026-12-25T00:00:00.000Z");

      expect(scheduled.status).toBe("SCHEDULED");
      expect(scheduled.scheduledAt).toBe("2026-12-25T00:00:00.000Z");
    });
  });

  describe("sendCampaignNow", () => {
    it("rejects an incomplete campaign", async () => {
      const incomplete = buildCampaign({ id: "incomplete-id", groupIds: [] });
      const { service } = buildService({ campaigns: [incomplete] });

      await expect(service.sendCampaignNow("incomplete-id")).rejects.toThrow(CampaignValidationError);
    });

    it("rejects an already-sent campaign", async () => {
      const sent = buildCampaign({ id: "sent-id", status: "SENT" });
      const { service } = buildService({ campaigns: [sent] });

      await expect(service.sendCampaignNow("sent-id")).rejects.toThrow(CampaignAlreadySentError);
    });

    it("throws GroupNotFoundError when a referenced group does not exist", async () => {
      const campaign = buildCampaign({ id: "campaign-id", groupIds: ["missing-group"] });
      const { service } = buildService({ campaigns: [campaign] });

      await expect(service.sendCampaignNow("campaign-id")).rejects.toThrow(GroupNotFoundError);
    });

    it("resolves recipients across multiple groups via services (not repositories), sends once per recipient, and sets SENT metadata", async () => {
      const alice = buildContact({ id: "alice-id", email: "alice@example.com" });
      const bob = buildContact({ id: "bob-id", email: "bob@example.com" });
      const groupA = buildGroup({ id: "group-a", contactIds: ["alice-id"] });
      const groupB = buildGroup({ id: "group-b", contactIds: ["bob-id"] });
      const campaign = buildCampaign({ id: "campaign-id", groupIds: ["group-a", "group-b"] });

      const emailSender = createFakeEmailSender();
      const { service, campaignRepository } = buildService({
        campaigns: [campaign],
        groups: [groupA, groupB],
        contacts: [alice, bob],
        emailSender,
      });

      const sent = await service.sendCampaignNow("campaign-id");

      expect(sent.status).toBe("SENT");
      expect(sent.sentCount).toBe(2);
      expect(sent.sentAt).not.toBeNull();
      expect(emailSender.sent).toHaveLength(2);
      expect(emailSender.sent.map((message) => message.to).sort()).toEqual(["alice@example.com", "bob@example.com"]);
      expect(await campaignRepository.findById("campaign-id")).toMatchObject({ status: "SENT", sentCount: 2 });
    });

    it("skips a recipient whose contact record no longer exists, without failing the send", async () => {
      const group = buildGroup({ id: "group-a", contactIds: ["stale-contact-id"] });
      const campaign = buildCampaign({ id: "campaign-id", groupIds: ["group-a"] });
      const emailSender = createFakeEmailSender();
      const { service } = buildService({ campaigns: [campaign], groups: [group], contacts: [], emailSender });

      const sent = await service.sendCampaignNow("campaign-id");

      expect(sent.sentCount).toBe(0);
      expect(emailSender.sent).toHaveLength(0);
    });
  });

  describe("deleteCampaign", () => {
    it("removes the campaign regardless of status", async () => {
      const sent = buildCampaign({ id: "sent-id", status: "SENT" });
      const { service, campaignRepository } = buildService({ campaigns: [sent] });

      await service.deleteCampaign("sent-id");

      expect(await campaignRepository.findById("sent-id")).toBeUndefined();
    });

    it("throws CampaignNotFoundError when the campaign does not exist", async () => {
      const { service } = buildService();

      await expect(service.deleteCampaign("missing-id")).rejects.toThrow(CampaignNotFoundError);
    });
  });
});

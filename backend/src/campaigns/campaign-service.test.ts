import { describe, expect, it } from "vitest";
import type { Contact } from "@email-campaign-v2/contracts";

import type { ContactRepository } from "../contacts/contact-repository";
import type { GroupRepository, GroupRow } from "../groups/group-repository";
import { ConflictError, ValidationError } from "./campaign-errors";
import { CampaignService } from "./campaign-service";
import type { CampaignRepository, CampaignRow } from "./campaign-repository";
import { MockEmailSender } from "./email-sender";

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

function createFakeContactRepository(seed: Contact[] = []): ContactRepository {
  return {
    async findByIds(ids: string[]) {
      return seed.filter((row) => ids.includes(row.id));
    },
  } as unknown as ContactRepository;
}

function buildGroupRow(overrides: Partial<GroupRow> = {}): GroupRow {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "Group",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createFakeGroupRepository(rows: GroupRow[] = [], membership: Record<string, string[]> = {}): GroupRepository {
  return {
    async findByIds(ids: string[]) {
      return rows.filter((row) => ids.includes(row.id));
    },
    async findContactIdsForGroups(groupIds: string[]) {
      const result: string[] = [];
      for (const groupId of groupIds) {
        result.push(...(membership[groupId] ?? []));
      }
      return result;
    },
  } as unknown as GroupRepository;
}

function buildCampaignRow(overrides: Partial<CampaignRow> = {}): CampaignRow {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "Campaign",
    subject: "Subject",
    sender: "sender@example.com",
    body: "Hi {{name}}, welcome!",
    status: "Draft",
    scheduledAt: null,
    sentAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

interface FakeCampaignRepository extends CampaignRepository {
  updateCalls: { id: string; changes: Partial<Omit<CampaignRow, "id">> }[];
}

function createFakeCampaignRepository(
  seed: CampaignRow[] = [],
  targetGroups: Record<string, string[]> = {}
): FakeCampaignRepository {
  const rows = [...seed];
  const groups = new Map<string, string[]>(Object.entries(targetGroups));
  const updateCalls: { id: string; changes: Partial<Omit<CampaignRow, "id">> }[] = [];

  return {
    updateCalls,
    async findAll(status?: string, search?: string) {
      return rows.filter(
        (row) =>
          (!status || row.status === status) && (!search || row.name.toLowerCase().includes(search.toLowerCase()))
      );
    },
    async findById(id: string) {
      return rows.find((row) => row.id === id);
    },
    async create(row: CampaignRow) {
      rows.push(row);
      if (!groups.has(row.id)) groups.set(row.id, []);
      return row;
    },
    async update(id: string, changes: Partial<Omit<CampaignRow, "id">>) {
      updateCalls.push({ id, changes });
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) return undefined;
      rows[index] = { ...rows[index], ...changes };
      return rows[index];
    },
    async findTargetGroupIds(id: string) {
      return groups.get(id) ?? [];
    },
    async setTargetGroups(id: string, groupIds: string[]) {
      groups.set(id, groupIds);
    },
  } as unknown as FakeCampaignRepository;
}

describe("CampaignService.createCampaign (T1)", () => {
  it("rejects unknown targetGroupIds", async () => {
    const groupRepository = createFakeGroupRepository([buildGroupRow({ id: "g1" })]);
    const service = new CampaignService(
      createFakeCampaignRepository(),
      groupRepository,
      createFakeContactRepository(),
      new MockEmailSender()
    );

    await expect(
      service.createCampaign({ name: "N", subject: "S", body: "B", targetGroupIds: ["g1", "missing"] })
    ).rejects.toThrow(ValidationError);
  });
});

describe("CampaignService.createCampaign (T2)", () => {
  it("requires at least one targetGroupId", async () => {
    const service = new CampaignService(
      createFakeCampaignRepository(),
      createFakeGroupRepository(),
      createFakeContactRepository(),
      new MockEmailSender()
    );

    await expect(service.createCampaign({ name: "N", subject: "S", body: "B", targetGroupIds: [] })).rejects.toThrow(
      ValidationError
    );
  });

  it("defaults sender from SES_FROM_EMAIL when omitted", async () => {
    process.env.SES_FROM_EMAIL = "default@example.com";
    try {
      const groupRepository = createFakeGroupRepository([buildGroupRow({ id: "g1" })]);
      const service = new CampaignService(
        createFakeCampaignRepository(),
        groupRepository,
        createFakeContactRepository(),
        new MockEmailSender()
      );

      const campaign = await service.createCampaign({ name: "N", subject: "S", body: "B", targetGroupIds: ["g1"] });

      expect(campaign.sender).toBe("default@example.com");
    } finally {
      delete process.env.SES_FROM_EMAIL;
    }
  });

  it("throws a ValidationError when sender is omitted and SES_FROM_EMAIL is not configured", async () => {
    delete process.env.SES_FROM_EMAIL;
    const groupRepository = createFakeGroupRepository([buildGroupRow({ id: "g1" })]);
    const service = new CampaignService(
      createFakeCampaignRepository(),
      groupRepository,
      createFakeContactRepository(),
      new MockEmailSender()
    );

    await expect(
      service.createCampaign({ name: "N", subject: "S", body: "B", targetGroupIds: ["g1"] })
    ).rejects.toThrow(ValidationError);
  });
});

describe("CampaignService.updateCampaign (T3)", () => {
  it("rejects any update when the campaign's status is not Draft", async () => {
    const campaign = buildCampaignRow({ id: "c1", status: "Sent" });
    const campaignRepository = createFakeCampaignRepository([campaign]);
    const service = new CampaignService(
      campaignRepository,
      createFakeGroupRepository(),
      createFakeContactRepository(),
      new MockEmailSender()
    );

    await expect(service.updateCampaign("c1", { name: "New name" })).rejects.toThrow(ConflictError);
  });
});

describe("CampaignService.updateCampaign (T4)", () => {
  it("re-validates supplied targetGroupIds and replaces the campaign's target group set", async () => {
    const campaign = buildCampaignRow({ id: "c1", status: "Draft" });
    const groupRepository = createFakeGroupRepository([buildGroupRow({ id: "g1" }), buildGroupRow({ id: "g2" })]);
    const campaignRepository = createFakeCampaignRepository([campaign], { c1: ["g1"] });
    const service = new CampaignService(
      campaignRepository,
      groupRepository,
      createFakeContactRepository(),
      new MockEmailSender()
    );

    const updated = await service.updateCampaign("c1", { targetGroupIds: ["g2"] });
    expect(updated.targetGroupIds).toEqual(["g2"]);

    await expect(service.updateCampaign("c1", { targetGroupIds: ["missing"] })).rejects.toThrow(ValidationError);
  });
});

describe("CampaignService.scheduleCampaign (T5)", () => {
  it("rejects non-Draft campaigns", async () => {
    const campaign = buildCampaignRow({ id: "c1", status: "Sent" });
    const campaignRepository = createFakeCampaignRepository([campaign]);
    const service = new CampaignService(
      campaignRepository,
      createFakeGroupRepository(),
      createFakeContactRepository(),
      new MockEmailSender()
    );

    const future = new Date(Date.now() + 60_000).toISOString();
    await expect(service.scheduleCampaign("c1", { scheduledAt: future })).rejects.toThrow(ConflictError);
  });

  it("validates scheduledAt is a well-formed, future timestamp", async () => {
    const campaign = buildCampaignRow({ id: "c1", status: "Draft" });
    const campaignRepository = createFakeCampaignRepository([campaign]);
    const service = new CampaignService(
      campaignRepository,
      createFakeGroupRepository(),
      createFakeContactRepository(),
      new MockEmailSender()
    );

    await expect(service.scheduleCampaign("c1", { scheduledAt: "not-a-date" })).rejects.toThrow(ValidationError);
    await expect(
      service.scheduleCampaign("c1", { scheduledAt: new Date(Date.now() - 1000).toISOString() })
    ).rejects.toThrow(ValidationError);
  });

  it("transitions Draft to Scheduled", async () => {
    const campaign = buildCampaignRow({ id: "c1", status: "Draft" });
    const campaignRepository = createFakeCampaignRepository([campaign]);
    const service = new CampaignService(
      campaignRepository,
      createFakeGroupRepository(),
      createFakeContactRepository(),
      new MockEmailSender()
    );

    const future = new Date(Date.now() + 60_000).toISOString();
    const updated = await service.scheduleCampaign("c1", { scheduledAt: future });

    expect(updated.status).toBe("Scheduled");
    expect(updated.scheduledAt).toBe(future);
  });
});

describe("CampaignService recipient resolution (T6)", () => {
  it("deduplicates a contact present in multiple target groups to a single recipient", async () => {
    const contact = buildContact({ id: "c1", email: "shared@example.com" });
    const campaign = buildCampaignRow({ id: "camp1", status: "Draft" });
    const groupRepository = createFakeGroupRepository([buildGroupRow({ id: "g1" }), buildGroupRow({ id: "g2" })], {
      g1: ["c1"],
      g2: ["c1"],
    });
    const campaignRepository = createFakeCampaignRepository([campaign], { camp1: ["g1", "g2"] });
    const emailSender = new MockEmailSender();
    const service = new CampaignService(
      campaignRepository,
      groupRepository,
      createFakeContactRepository([contact]),
      emailSender
    );

    await service.sendNow("camp1");

    expect(emailSender.sentMessages).toHaveLength(1);
    expect(emailSender.sentMessages[0].to).toBe("shared@example.com");
  });
});

describe("CampaignService.sendNow (T7)", () => {
  it("transitions to Failed and dispatches no email when resolved recipients are empty", async () => {
    const campaign = buildCampaignRow({ id: "camp1", status: "Draft" });
    const groupRepository = createFakeGroupRepository([buildGroupRow({ id: "g1" })], { g1: [] });
    const campaignRepository = createFakeCampaignRepository([campaign], { camp1: ["g1"] });
    const emailSender = new MockEmailSender();
    const service = new CampaignService(
      campaignRepository,
      groupRepository,
      createFakeContactRepository(),
      emailSender
    );

    const result = await service.sendNow("camp1");

    expect(result.status).toBe("Failed");
    expect(emailSender.sentMessages).toHaveLength(0);
  });
});

describe("Placeholder substitution (T8)", () => {
  it("replaces {{name}} per recipient and leaves unrecognized placeholders unchanged", async () => {
    const contact = buildContact({ id: "c1", name: "Grace Hopper", email: "grace@example.com" });
    const campaign = buildCampaignRow({
      id: "camp1",
      status: "Draft",
      body: "Hi {{name}}, check out {{unknown}}!",
    });
    const groupRepository = createFakeGroupRepository([buildGroupRow({ id: "g1" })], { g1: ["c1"] });
    const campaignRepository = createFakeCampaignRepository([campaign], { camp1: ["g1"] });
    const emailSender = new MockEmailSender();
    const service = new CampaignService(
      campaignRepository,
      groupRepository,
      createFakeContactRepository([contact]),
      emailSender
    );

    await service.sendNow("camp1");

    expect(emailSender.sentMessages[0].body).toBe("Hi Grace Hopper, check out {{unknown}}!");
  });
});

describe("CampaignService.duplicateCampaign (T9)", () => {
  it("creates a new Draft campaign copying subject/body/targetGroupIds with no scheduledAt/sentAt", async () => {
    const original = buildCampaignRow({
      id: "camp1",
      name: "Original",
      subject: "Subj",
      body: "Body {{name}}",
      status: "Sent",
      scheduledAt: "2026-01-01T00:00:00.000Z",
      sentAt: "2026-01-01T01:00:00.000Z",
    });
    const campaignRepository = createFakeCampaignRepository([original], { camp1: ["g1", "g2"] });
    const service = new CampaignService(
      campaignRepository,
      createFakeGroupRepository(),
      createFakeContactRepository(),
      new MockEmailSender()
    );

    const duplicate = await service.duplicateCampaign("camp1");

    expect(duplicate.id).not.toBe("camp1");
    expect(duplicate.name).toBe("Original");
    expect(duplicate.subject).toBe("Subj");
    expect(duplicate.body).toBe("Body {{name}}");
    expect([...duplicate.targetGroupIds].sort()).toEqual(["g1", "g2"]);
    expect(duplicate.status).toBe("Draft");
    expect(duplicate.scheduledAt).toBeNull();
    expect(duplicate.sentAt).toBeNull();
  });
});

describe("CampaignService.sendNow status transitions (T10)", () => {
  it("transitions Draft to Sending to Sent when all dispatches succeed via the injected EmailSender", async () => {
    const contact = buildContact({ id: "c1" });
    const campaign = buildCampaignRow({ id: "camp1", status: "Draft" });
    const groupRepository = createFakeGroupRepository([buildGroupRow({ id: "g1" })], { g1: ["c1"] });
    const campaignRepository = createFakeCampaignRepository([campaign], { camp1: ["g1"] });
    const emailSender = new MockEmailSender();
    const service = new CampaignService(
      campaignRepository,
      groupRepository,
      createFakeContactRepository([contact]),
      emailSender
    );

    const result = await service.sendNow("camp1");

    const statusesSeen = campaignRepository.updateCalls
      .filter((call) => call.id === "camp1")
      .map((call) => call.changes.status);
    expect(statusesSeen).toEqual(["Sending", "Sent"]);
    expect(result.status).toBe("Sent");
    expect(result.sentAt).toBeTruthy();
    expect(emailSender.sentMessages).toHaveLength(1);
  });
});

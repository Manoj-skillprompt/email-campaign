import type { Campaign } from "@email-campaign-v2/contracts";
import type Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { CampaignRepository as CampaignRepositoryClass } from "./campaign-repository";

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

function buildCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: crypto.randomUUID(),
    name: `Campaign ${crypto.randomUUID()}`,
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

let sqlite: Database.Database;
let repository: CampaignRepositoryClass;

beforeAll(async () => {
  process.env.DATABASE_PATH = ":memory:";
  const clientModule = await import("../db/client");
  sqlite = clientModule.sqlite;
  applyMigrations(sqlite);
  const repositoryModule = await import("./campaign-repository");
  repository = repositoryModule.campaignRepository;
});

beforeEach(() => {
  sqlite.exec("DELETE FROM campaigns");
});

afterAll(() => {
  sqlite.close();
});

describe("CampaignRepository", () => {
  it("creates a campaign and returns it", async () => {
    const campaign = buildCampaign({ groupIds: ["group-1", "group-2"] });

    const created = await repository.create(campaign);

    expect(created).toEqual(campaign);
    expect(await repository.findById(campaign.id)).toEqual(campaign);
  });

  it("finds all campaigns when no filters are given", async () => {
    await repository.create(buildCampaign({ name: "First" }));
    await repository.create(buildCampaign({ name: "Second" }));

    const results = await repository.findAll();

    expect(results).toHaveLength(2);
  });

  it("searches case-insensitively by name", async () => {
    const match = buildCampaign({ name: "VIP Announcement" });
    const noMatch = buildCampaign({ name: "Newsletter" });
    await repository.create(match);
    await repository.create(noMatch);

    const results = await repository.findAll("vip");

    expect(results.map((campaign) => campaign.id)).toEqual([match.id]);
  });

  it("filters by status", async () => {
    const draft = buildCampaign({ name: "Draft One", status: "DRAFT" });
    const sent = buildCampaign({ name: "Sent One", status: "SENT" });
    await repository.create(draft);
    await repository.create(sent);

    const draftResults = await repository.findAll(undefined, "DRAFT");
    expect(draftResults.map((campaign) => campaign.id)).toEqual([draft.id]);

    const sentResults = await repository.findAll(undefined, "SENT");
    expect(sentResults.map((campaign) => campaign.id)).toEqual([sent.id]);
  });

  it("combines search and status filters", async () => {
    const match = buildCampaign({ name: "Combined Match", status: "SCHEDULED" });
    const wrongStatus = buildCampaign({ name: "Combined Match Two", status: "DRAFT" });
    const wrongName = buildCampaign({ name: "Unrelated", status: "SCHEDULED" });
    await repository.create(match);
    await repository.create(wrongStatus);
    await repository.create(wrongName);

    const results = await repository.findAll("combined", "SCHEDULED");

    expect(results.map((campaign) => campaign.id)).toEqual([match.id]);
  });

  it("updates a campaign's fields, including groupIds and status", async () => {
    const campaign = buildCampaign({ groupIds: [] });
    await repository.create(campaign);

    const updated = await repository.update(campaign.id, {
      status: "SCHEDULED",
      scheduledAt: "2026-12-25T00:00:00.000Z",
      groupIds: ["group-1"],
    });

    expect(updated.status).toBe("SCHEDULED");
    expect(updated.scheduledAt).toBe("2026-12-25T00:00:00.000Z");
    expect(updated.groupIds).toEqual(["group-1"]);
    expect((await repository.findById(campaign.id))?.groupIds).toEqual(["group-1"]);
  });

  it("deletes a campaign without affecting unrelated records", async () => {
    const target = buildCampaign();
    const other = buildCampaign();
    await repository.create(target);
    await repository.create(other);

    await repository.delete(target.id);

    expect(await repository.findById(target.id)).toBeUndefined();
    expect(await repository.findById(other.id)).toEqual(other);
  });
});

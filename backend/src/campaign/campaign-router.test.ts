import { campaignsContract, contactsContract, groupsContract } from "@email-campaign-v2/contracts";
import { createExpressEndpoints } from "@ts-rest/express";
import type Database from "better-sqlite3";
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

let sqlite: Database.Database;
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  process.env.DATABASE_PATH = ":memory:";

  // The real SesEmailSender is constructed as a module-level singleton and would attempt a
  // live AWS call during sendCampaignNow; stub it so router tests never touch the network.
  vi.mock("./email-sender", async (importOriginal) => {
    const actual = await importOriginal<typeof import("./email-sender")>();
    return {
      ...actual,
      sesEmailSender: { sendEmail: vi.fn().mockResolvedValue(undefined) },
    };
  });

  const clientModule = await import("../db/client");
  sqlite = clientModule.sqlite;
  applyMigrations(sqlite);

  const { contactRouter } = await import("../contacts/contact-router");
  const { groupRouter } = await import("../groups/group-router");
  const { campaignRouter } = await import("./campaign-router");

  const app = express();
  app.use(express.json());
  createExpressEndpoints(contactsContract, contactRouter, app);
  createExpressEndpoints(groupsContract, groupRouter, app);
  createExpressEndpoints(campaignsContract, campaignRouter, app);

  server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://localhost:${port}`;
});

beforeEach(() => {
  sqlite.exec("DELETE FROM campaigns");
  sqlite.exec("DELETE FROM groups");
  sqlite.exec("DELETE FROM contacts");
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  sqlite.close();
});

interface ApiContact {
  id: string;
}

interface ApiGroup {
  id: string;
}

interface ApiCampaign {
  id: string;
  name: string;
  status: string;
  sentCount: number;
  groupIds: string[];
}

async function createContactViaApi(overrides: Partial<{ name: string; email: string; branch: string }> = {}) {
  const response = await fetch(`${baseUrl}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Ada Lovelace",
      email: `ada-${crypto.randomUUID()}@example.com`,
      branch: "London",
      ...overrides,
    }),
  });
  return (await response.json()) as ApiContact;
}

async function createGroupViaApi(overrides: Partial<{ name: string }> = {}) {
  const response = await fetch(`${baseUrl}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `Group ${crypto.randomUUID()}`, ...overrides }),
  });
  return (await response.json()) as ApiGroup;
}

async function assignContactViaApi(groupId: string, contactId: string) {
  return fetch(`${baseUrl}/groups/${groupId}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contactId }),
  });
}

async function createCampaignViaApi(overrides: Partial<{ name: string }> = {}) {
  const response = await fetch(`${baseUrl}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `Campaign ${crypto.randomUUID()}`, ...overrides }),
  });
  return (await response.json()) as ApiCampaign;
}

async function makeCampaignFullyValid(campaignId: string, groupId: string) {
  return fetch(`${baseUrl}/campaigns/${campaignId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject: "Hello", senderEmail: "info@skillprompt.com", groupIds: [groupId] }),
  });
}

describe("campaigns router", () => {
  describe("POST /campaigns", () => {
    it("returns 201 and a DRAFT campaign with zeroed metrics", async () => {
      const response = await fetch(`${baseUrl}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Campaign" }),
      });

      expect(response.status).toBe(201);
      const body = (await response.json()) as ApiCampaign;
      expect(body.status).toBe("DRAFT");
      expect(body.sentCount).toBe(0);
    });

    it("returns 400 for an invalid payload", async () => {
      const response = await fetch(`${baseUrl}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /campaigns", () => {
    it("returns 200 with all campaigns, filtered by search and status when provided", async () => {
      await createCampaignViaApi({ name: "Findable Campaign" });
      await createCampaignViaApi({ name: "Someone Else" });

      const all = await fetch(`${baseUrl}/campaigns`);
      expect(await all.json()).toHaveLength(2);

      const filtered = await fetch(`${baseUrl}/campaigns?search=findable`);
      const filteredBody = (await filtered.json()) as ApiCampaign[];
      expect(filteredBody).toHaveLength(1);
      expect(filteredBody[0]?.name).toBe("Findable Campaign");

      const byStatus = await fetch(`${baseUrl}/campaigns?status=SENT`);
      expect(await byStatus.json()).toHaveLength(0);
    });
  });

  describe("PATCH /campaigns/:id", () => {
    it("returns 200 with the updated campaign", async () => {
      const created = await createCampaignViaApi();

      const response = await fetch(`${baseUrl}/campaigns/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "New Subject" }),
      });

      expect(response.status).toBe(200);
    });

    it("returns 404 when the campaign does not exist", async () => {
      const response = await fetch(`${baseUrl}/campaigns/does-not-exist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "New Subject" }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /campaigns/:id/schedule", () => {
    it("returns 400 when the campaign is incomplete", async () => {
      const created = await createCampaignViaApi();

      const response = await fetch(`${baseUrl}/campaigns/${created.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: "2026-12-25T00:00:00.000Z" }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 200 and sets status SCHEDULED for a complete campaign", async () => {
      const group = await createGroupViaApi();
      const created = await createCampaignViaApi();
      await makeCampaignFullyValid(created.id, group.id);

      const response = await fetch(`${baseUrl}/campaigns/${created.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: "2026-12-25T00:00:00.000Z" }),
      });

      expect(response.status).toBe(200);
      const body = (await response.json()) as ApiCampaign;
      expect(body.status).toBe("SCHEDULED");
    });

    it("returns 404 when the campaign does not exist", async () => {
      const response = await fetch(`${baseUrl}/campaigns/does-not-exist/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: "2026-12-25T00:00:00.000Z" }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /campaigns/:id/send", () => {
    it("resolves recipients across contacts and groups and sets status SENT", async () => {
      const contact = await createContactViaApi();
      const group = await createGroupViaApi();
      await assignContactViaApi(group.id, contact.id);
      const created = await createCampaignViaApi();
      await makeCampaignFullyValid(created.id, group.id);

      const response = await fetch(`${baseUrl}/campaigns/${created.id}/send`, { method: "POST" });

      expect(response.status).toBe(200);
      const body = (await response.json()) as ApiCampaign;
      expect(body.status).toBe("SENT");
      expect(body.sentCount).toBe(1);
    });

    it("returns 409 when the campaign has already been sent", async () => {
      const contact = await createContactViaApi();
      const group = await createGroupViaApi();
      await assignContactViaApi(group.id, contact.id);
      const created = await createCampaignViaApi();
      await makeCampaignFullyValid(created.id, group.id);
      await fetch(`${baseUrl}/campaigns/${created.id}/send`, { method: "POST" });

      const response = await fetch(`${baseUrl}/campaigns/${created.id}/send`, { method: "POST" });

      expect(response.status).toBe(409);
    });

    it("returns 400 when the campaign is incomplete", async () => {
      const created = await createCampaignViaApi();

      const response = await fetch(`${baseUrl}/campaigns/${created.id}/send`, { method: "POST" });

      expect(response.status).toBe(400);
    });

    it("returns 404 when the campaign does not exist", async () => {
      const response = await fetch(`${baseUrl}/campaigns/does-not-exist/send`, { method: "POST" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /campaigns/:id", () => {
    it("returns 204 and removes the campaign", async () => {
      const created = await createCampaignViaApi();

      const response = await fetch(`${baseUrl}/campaigns/${created.id}`, { method: "DELETE" });
      expect(response.status).toBe(204);

      const afterDelete = await fetch(`${baseUrl}/campaigns`);
      expect(await afterDelete.json()).toHaveLength(0);
    });

    it("returns 404 when the campaign does not exist", async () => {
      const response = await fetch(`${baseUrl}/campaigns/does-not-exist`, { method: "DELETE" });

      expect(response.status).toBe(404);
    });
  });
});

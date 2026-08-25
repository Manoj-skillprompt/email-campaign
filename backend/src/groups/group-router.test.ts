import { contactsContract, groupsContract } from "@email-campaign-v2/contracts";
import { createExpressEndpoints } from "@ts-rest/express";
import type Database from "better-sqlite3";
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
  const clientModule = await import("../db/client");
  sqlite = clientModule.sqlite;
  applyMigrations(sqlite);

  const { contactRouter } = await import("../contacts/contact-router");
  const { groupRouter } = await import("./group-router");

  const app = express();
  app.use(express.json());
  createExpressEndpoints(contactsContract, contactRouter, app);
  createExpressEndpoints(groupsContract, groupRouter, app);

  server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://localhost:${port}`;
});

beforeEach(() => {
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
  name: string;
  contactIds: string[];
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

async function assignViaApi(groupId: string, contactId: string) {
  return fetch(`${baseUrl}/groups/${groupId}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contactId }),
  });
}

describe("groups router", () => {
  describe("POST /groups", () => {
    it("returns 201 and the created group with an empty contactIds list", async () => {
      const response = await fetch(`${baseUrl}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "VIP Customers" }),
      });

      expect(response.status).toBe(201);
      const body = (await response.json()) as ApiGroup;
      expect(body.name).toBe("VIP Customers");
      expect(body.contactIds).toEqual([]);
    });

    it("returns 409 when the name is already taken", async () => {
      await createGroupViaApi({ name: "Duplicate Name" });

      const response = await fetch(`${baseUrl}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Duplicate Name" }),
      });

      expect(response.status).toBe(409);
    });

    it("returns 400 for an invalid payload", async () => {
      const response = await fetch(`${baseUrl}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /groups", () => {
    it("returns 200 with all groups, filtered by search when provided", async () => {
      await createGroupViaApi({ name: "Findable Group" });
      await createGroupViaApi({ name: "Someone Else" });

      const all = await fetch(`${baseUrl}/groups`);
      expect(await all.json()).toHaveLength(2);

      const filtered = await fetch(`${baseUrl}/groups?search=findable`);
      const filteredBody = (await filtered.json()) as ApiGroup[];
      expect(filteredBody).toHaveLength(1);
      expect(filteredBody[0]?.name).toBe("Findable Group");
    });
  });

  describe("PATCH /groups/:id", () => {
    it("returns 200 with the updated group", async () => {
      const created = await createGroupViaApi({ name: "Old Name" });

      const response = await fetch(`${baseUrl}/groups/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name" }),
      });

      expect(response.status).toBe(200);
      expect(((await response.json()) as ApiGroup).name).toBe("New Name");
    });

    it("returns 404 when the group does not exist", async () => {
      const response = await fetch(`${baseUrl}/groups/does-not-exist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name" }),
      });

      expect(response.status).toBe(404);
    });

    it("returns 409 when renaming to a name already in use", async () => {
      const nameInUse = "Taken Name";
      await createGroupViaApi({ name: nameInUse });
      const target = await createGroupViaApi();

      const response = await fetch(`${baseUrl}/groups/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInUse }),
      });

      expect(response.status).toBe(409);
    });
  });

  describe("DELETE /groups/:id", () => {
    it("returns 204 and removes the group", async () => {
      const created = await createGroupViaApi();

      const response = await fetch(`${baseUrl}/groups/${created.id}`, { method: "DELETE" });
      expect(response.status).toBe(204);

      const afterDelete = await fetch(`${baseUrl}/groups`);
      expect(await afterDelete.json()).toHaveLength(0);
    });

    it("returns 404 when the group does not exist", async () => {
      const response = await fetch(`${baseUrl}/groups/does-not-exist`, { method: "DELETE" });
      expect(response.status).toBe(404);
    });
  });

  describe("POST /groups/:id/contacts (assign)", () => {
    it("returns 200 and adds the contact to the group", async () => {
      const group = await createGroupViaApi();
      const contact = await createContactViaApi();

      const response = await assignViaApi(group.id, contact.id);

      expect(response.status).toBe(200);
      const body = (await response.json()) as ApiGroup;
      expect(body.contactIds).toEqual([contact.id]);
    });

    it("returns 404 when the group does not exist", async () => {
      const contact = await createContactViaApi();

      const response = await assignViaApi("does-not-exist", contact.id);

      expect(response.status).toBe(404);
    });

    it("returns 404 when the contact does not exist", async () => {
      const group = await createGroupViaApi();

      const response = await assignViaApi(group.id, "does-not-exist");

      expect(response.status).toBe(404);
    });

    it("moves the contact out of its previous group", async () => {
      const contact = await createContactViaApi();
      const sourceGroup = await createGroupViaApi();
      const targetGroup = await createGroupViaApi();

      await assignViaApi(sourceGroup.id, contact.id);
      await assignViaApi(targetGroup.id, contact.id);

      const allGroups = (await (await fetch(`${baseUrl}/groups`)).json()) as ApiGroup[];
      const refreshedSource = allGroups.find((group) => group.id === sourceGroup.id);
      const refreshedTarget = allGroups.find((group) => group.id === targetGroup.id);

      expect(refreshedSource?.contactIds).toEqual([]);
      expect(refreshedTarget?.contactIds).toEqual([contact.id]);
    });
  });

  describe("DELETE /groups/:id/contacts/:contactId (unassign)", () => {
    it("returns 200 and removes the contact from the group without deleting the contact", async () => {
      const contact = await createContactViaApi();
      const group = await createGroupViaApi();
      await assignViaApi(group.id, contact.id);

      const response = await fetch(`${baseUrl}/groups/${group.id}/contacts/${contact.id}`, { method: "DELETE" });

      expect(response.status).toBe(200);
      expect(((await response.json()) as ApiGroup).contactIds).toEqual([]);

      const contactsAfter = await fetch(`${baseUrl}/contacts`);
      expect(await contactsAfter.json()).toHaveLength(1);
    });

    it("returns 404 when the group does not exist", async () => {
      const response = await fetch(`${baseUrl}/groups/does-not-exist/contacts/some-contact`, { method: "DELETE" });

      expect(response.status).toBe(404);
    });
  });
});

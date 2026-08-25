import { contactsContract } from "@email-campaign-v2/contracts";
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

  const { contactRouter } = await import("./contact-router");

  const app = express();
  app.use(express.json());
  createExpressEndpoints(contactsContract, contactRouter, app);

  server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://localhost:${port}`;
});

beforeEach(() => {
  sqlite.exec("DELETE FROM contacts");
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  sqlite.close();
});

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
  return response;
}

describe("contacts router", () => {
  describe("POST /contacts", () => {
    it("returns 201 and the created contact for a valid payload", async () => {
      const response = await createContactViaApi({ name: "Grace Hopper" });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.name).toBe("Grace Hopper");
      expect(body.clientId).toMatch(/^LOCAL-/);
    });

    it("returns 409 when the email is already taken", async () => {
      const email = `dup-${crypto.randomUUID()}@example.com`;
      await createContactViaApi({ email });

      const response = await createContactViaApi({ email });

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.message).toContain(email);
    });

    it("returns 400 for an invalid payload", async () => {
      const response = await fetch(`${baseUrl}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "", email: "not-an-email", branch: "" }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /contacts", () => {
    it("returns 200 with all contacts, filtered by search when provided", async () => {
      await createContactViaApi({ name: "Findable Person", branch: "Kathmandu" });
      await createContactViaApi({ name: "Someone Else", branch: "Pokhara" });

      const all = await fetch(`${baseUrl}/contacts`);
      expect(all.status).toBe(200);
      expect(await all.json()).toHaveLength(2);

      const filtered = await fetch(`${baseUrl}/contacts?search=findable`);
      expect(filtered.status).toBe(200);
      const filteredBody = await filtered.json();
      expect(filteredBody).toHaveLength(1);
      expect(filteredBody[0].name).toBe("Findable Person");
    });
  });

  describe("PATCH /contacts/:id", () => {
    it("returns 200 with the updated contact", async () => {
      const created = await (await createContactViaApi({ branch: "Old Branch" })).json();

      const response = await fetch(`${baseUrl}/contacts/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: "New Branch" }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.branch).toBe("New Branch");
    });

    it("returns 404 when the contact does not exist", async () => {
      const response = await fetch(`${baseUrl}/contacts/does-not-exist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: "New Branch" }),
      });

      expect(response.status).toBe(404);
    });

    it("returns 409 when updating to an email already in use", async () => {
      const emailInUse = `taken-${crypto.randomUUID()}@example.com`;
      await createContactViaApi({ email: emailInUse });
      const target = await (await createContactViaApi()).json();

      const response = await fetch(`${baseUrl}/contacts/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInUse }),
      });

      expect(response.status).toBe(409);
    });
  });

  describe("DELETE /contacts/:id", () => {
    it("returns 204 and removes the contact", async () => {
      const created = await (await createContactViaApi()).json();

      const response = await fetch(`${baseUrl}/contacts/${created.id}`, { method: "DELETE" });
      expect(response.status).toBe(204);

      const afterDelete = await fetch(`${baseUrl}/contacts`);
      expect(await afterDelete.json()).toHaveLength(0);
    });

    it("returns 404 when the contact does not exist", async () => {
      const response = await fetch(`${baseUrl}/contacts/does-not-exist`, { method: "DELETE" });
      expect(response.status).toBe(404);
    });
  });
});

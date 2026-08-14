import { existsSync, rmSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const TEST_PORT = 4531;
const TEST_DB_PATH = "data/contact-api.test.db";
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function createContact(overrides: Partial<{ name: string; email: string; branch: string }> = {}) {
  const res = await fetch(`${BASE_URL}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Ada Lovelace",
      email: `ada-${crypto.randomUUID()}@example.com`,
      branch: "London",
      ...overrides,
    }),
  });
  return res.json();
}

beforeAll(async () => {
  process.env.PORT = String(TEST_PORT);
  process.env.DATABASE_PATH = TEST_DB_PATH;
  await import("../index");
  // Give the express server a moment to finish binding the port.
  await new Promise((resolve) => setTimeout(resolve, 300));
});

afterAll(() => {
  for (const suffix of ["", "-shm", "-wal"]) {
    const path = `${TEST_DB_PATH}${suffix}`;
    if (existsSync(path)) rmSync(path);
  }
});

describe("POST /contacts (T6)", () => {
  it("returns 201 with the created Contact shape per FDS §5", async () => {
    const res = await fetch(`${BASE_URL}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Grace Hopper", email: "grace@example.com", branch: "Boston" }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ name: "Grace Hopper", email: "grace@example.com", branch: "Boston" });
    expect(body.id).toBeTruthy();
    expect(body.clientId).toMatch(/^LOCAL-[0-9a-f]{8}$/);
    expect(body.createdAt).toBeTruthy();
    expect(body.updatedAt).toBeTruthy();
  });
});

describe("POST /contacts duplicate email (T7)", () => {
  it("returns a 409 conflict response", async () => {
    await fetch(`${BASE_URL}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Dup One", email: "dup@example.com", branch: "NYC" }),
    });

    const res = await fetch(`${BASE_URL}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Dup Two", email: "dup@example.com", branch: "NYC" }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.message).toContain("dup@example.com");
  });
});

describe("GET /contacts (T8)", () => {
  it("lists all contacts and filters by a case-insensitive search term", async () => {
    await createContact({ name: "Bikash Thapa", email: "bikash-search@example.com", branch: "Lalitpur" });

    const allRes = await fetch(`${BASE_URL}/contacts`);
    expect(allRes.status).toBe(200);
    const all = await allRes.json();
    expect(all.length).toBeGreaterThan(0);

    const searchRes = await fetch(`${BASE_URL}/contacts?search=BIKASH`);
    const searchResults = await searchRes.json();
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].email).toBe("bikash-search@example.com");

    const branchSearchRes = await fetch(`${BASE_URL}/contacts?search=lalitpur`);
    const branchResults = await branchSearchRes.json();
    expect(branchResults).toHaveLength(1);
  });
});

describe("PATCH /contacts/:id (T9)", () => {
  it("updates a contact and returns a conflict on duplicate email", async () => {
    const created = await createContact({ name: "Sunita Adhikari", email: "sunita-patch@example.com" });

    const updateRes = await fetch(`${BASE_URL}/contacts/${created.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branch: "Kathmandu" }),
    });
    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();
    expect(updated.branch).toBe("Kathmandu");

    const other = await createContact({ email: "other-patch@example.com" });
    const conflictRes = await fetch(`${BASE_URL}/contacts/${created.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: other.email }),
    });
    expect(conflictRes.status).toBe(409);
  });

  it("returns 404 when updating a contact that does not exist", async () => {
    const res = await fetch(`${BASE_URL}/contacts/does-not-exist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branch: "X" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /contacts/:id (T10)", () => {
  it("removes the record", async () => {
    const created = await createContact({ email: "temp-delete@example.com" });

    const deleteRes = await fetch(`${BASE_URL}/contacts/${created.id}`, { method: "DELETE" });
    expect(deleteRes.status).toBe(204);

    const listRes = await fetch(`${BASE_URL}/contacts?search=temp-delete@example.com`);
    const results = await listRes.json();
    expect(results).toHaveLength(0);
  });

  it("does not remove other contacts (no cascading side effects)", async () => {
    const survivor = await createContact({ email: "survivor@example.com" });
    const victim = await createContact({ email: "victim@example.com" });

    await fetch(`${BASE_URL}/contacts/${victim.id}`, { method: "DELETE" });

    const res = await fetch(`${BASE_URL}/contacts/${survivor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branch: "Still Here" }),
    });
    expect(res.status).toBe(200);
  });

  it("returns 404 when deleting a contact that does not exist", async () => {
    const res = await fetch(`${BASE_URL}/contacts/does-not-exist`, { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});

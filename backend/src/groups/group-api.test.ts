import { existsSync, rmSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const TEST_PORT = 4532;
const TEST_DB_PATH = "data/group-api.test.db";
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

async function createGroup(overrides: Partial<{ name: string; contactIds: string[] }> = {}) {
  const res = await fetch(`${BASE_URL}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `Group ${crypto.randomUUID()}`, ...overrides }),
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

describe("POST /groups (T9)", () => {
  it("returns 201 with the created Group shape per FDS §7, including contactCount", async () => {
    const contact = await createContact();

    const res = await fetch(`${BASE_URL}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "VIP Customers", contactIds: [contact.id] }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ name: "VIP Customers", contactCount: 1 });
    expect(body.id).toBeTruthy();
    expect(body.createdAt).toBeTruthy();
    expect(body.updatedAt).toBeTruthy();
  });
});

describe("POST /groups duplicate name (T10)", () => {
  it("returns a conflict response", async () => {
    await createGroup({ name: "Dup Group" });

    const res = await fetch(`${BASE_URL}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Dup Group" }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.message).toContain("Dup Group");
  });
});

describe("POST /groups unknown contactId (T11)", () => {
  it("returns a validation error", async () => {
    const res = await fetch(`${BASE_URL}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Unknown Contact Group", contactIds: ["does-not-exist"] }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("does-not-exist");
  });
});

describe("GET /groups (T12)", () => {
  it("lists all groups and filters by a case-insensitive search term", async () => {
    await createGroup({ name: "Searchable Segment" });

    const allRes = await fetch(`${BASE_URL}/groups`);
    expect(allRes.status).toBe(200);
    const all = await allRes.json();
    expect(all.length).toBeGreaterThan(0);

    const searchRes = await fetch(`${BASE_URL}/groups?search=SEARCHABLE`);
    const searchResults = await searchRes.json();
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].name).toBe("Searchable Segment");
  });
});

describe("PATCH /groups/:id (T13)", () => {
  it("renames, adds, and removes contacts, returning a conflict on duplicate name", async () => {
    const contactA = await createContact();
    const contactB = await createContact();
    const group = await createGroup({ name: "Editable Group", contactIds: [contactA.id] });

    const updateRes = await fetch(`${BASE_URL}/groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Renamed Group",
        addContactIds: [contactB.id],
        removeContactIds: [contactA.id],
      }),
    });
    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();
    expect(updated.name).toBe("Renamed Group");
    expect(updated.contactCount).toBe(1);

    const other = await createGroup({ name: "Other Group" });
    const conflictRes = await fetch(`${BASE_URL}/groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: other.name }),
    });
    expect(conflictRes.status).toBe(409);
  });

  it("returns 404 when updating a group that does not exist", async () => {
    const res = await fetch(`${BASE_URL}/groups/does-not-exist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "X" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /groups/:id (T14)", () => {
  it("removes the group and does not alter member contact records", async () => {
    const contact = await createContact({ email: `member-${crypto.randomUUID()}@example.com` });
    const group = await createGroup({ name: "Deletable Group", contactIds: [contact.id] });

    const deleteRes = await fetch(`${BASE_URL}/groups/${group.id}`, { method: "DELETE" });
    expect(deleteRes.status).toBe(204);

    const listRes = await fetch(`${BASE_URL}/groups?search=Deletable Group`);
    const results = await listRes.json();
    expect(results).toHaveLength(0);

    const contactsRes = await fetch(`${BASE_URL}/contacts?search=${encodeURIComponent(contact.email)}`);
    const contacts = await contactsRes.json();
    expect(contacts).toHaveLength(1);
    expect(contacts[0].id).toBe(contact.id);
  });

  it("returns 404 when deleting a group that does not exist", async () => {
    const res = await fetch(`${BASE_URL}/groups/does-not-exist`, { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});

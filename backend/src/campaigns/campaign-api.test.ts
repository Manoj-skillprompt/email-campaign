import { existsSync, rmSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const TEST_PORT = 4533;
const TEST_DB_PATH = "data/campaign-api.test.db";
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

async function createCampaign(
  overrides: Partial<{ name: string; subject: string; sender: string; body: string; targetGroupIds: string[] }> = {}
) {
  const groupId = overrides.targetGroupIds ? undefined : (await createGroup()).id;
  const res = await fetch(`${BASE_URL}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `Campaign ${crypto.randomUUID()}`,
      subject: "Subject line",
      sender: "sender@example.com",
      body: "Hi {{name}}!",
      targetGroupIds: groupId ? [groupId] : [],
      ...overrides,
    }),
  });
  return res.json();
}

beforeAll(async () => {
  process.env.PORT = String(TEST_PORT);
  process.env.DATABASE_PATH = TEST_DB_PATH;
  process.env.CAMPAIGN_SCHEDULER_INTERVAL_MS = "300";
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

describe("POST /campaigns (T13)", () => {
  it("returns 201 with the created Campaign shape per FDS §8, status Draft", async () => {
    const group = await createGroup();

    const res = await fetch(`${BASE_URL}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Welcome Series",
        subject: "Welcome!",
        sender: "team@example.com",
        body: "Hi {{name}}, welcome!",
        targetGroupIds: [group.id],
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({
      name: "Welcome Series",
      subject: "Welcome!",
      sender: "team@example.com",
      body: "Hi {{name}}, welcome!",
      targetGroupIds: [group.id],
      status: "Draft",
      scheduledAt: null,
      sentAt: null,
    });
    expect(body.id).toBeTruthy();
    expect(body.createdAt).toBeTruthy();
    expect(body.updatedAt).toBeTruthy();
  });
});

describe("POST /campaigns unknown targetGroupId (T14)", () => {
  it("returns a validation error", async () => {
    const res = await fetch(`${BASE_URL}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Unknown Group Campaign",
        subject: "Subject",
        body: "Body",
        targetGroupIds: ["does-not-exist"],
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("does-not-exist");
  });
});

describe("POST /campaigns empty targetGroupIds array (T15)", () => {
  it("returns a validation error", async () => {
    const res = await fetch(`${BASE_URL}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "No Group Campaign", subject: "Subject", body: "Body", targetGroupIds: [] }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.issues?.[0]?.path).toContain("targetGroupIds");
  });
});

describe("GET /campaigns (T16)", () => {
  it("returns expected result sets filtered by status and a case-insensitive search term", async () => {
    const draft = await createCampaign({ name: `Findable Alpha ${crypto.randomUUID()}` });
    const toSchedule = await createCampaign({ name: `Findable Beta ${crypto.randomUUID()}` });
    const future = new Date(Date.now() + 60_000).toISOString();
    await fetch(`${BASE_URL}/campaigns/${toSchedule.id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: future }),
    });

    const allRes = await fetch(`${BASE_URL}/campaigns`);
    expect(allRes.status).toBe(200);
    const all = await allRes.json();
    expect(all.length).toBeGreaterThanOrEqual(2);

    const draftRes = await fetch(`${BASE_URL}/campaigns?status=Draft&search=${encodeURIComponent("findable alpha")}`);
    const draftResults = await draftRes.json();
    expect(draftResults).toHaveLength(1);
    expect(draftResults[0].id).toBe(draft.id);

    const scheduledRes = await fetch(`${BASE_URL}/campaigns?status=Scheduled`);
    const scheduledResults = await scheduledRes.json();
    expect(scheduledResults.some((c: { id: string }) => c.id === toSchedule.id)).toBe(true);
  });
});

describe("PATCH /campaigns/:id (T17)", () => {
  it("updates a Draft campaign and returns a conflict error for a non-Draft campaign", async () => {
    const campaign = await createCampaign({ name: "Editable Campaign" });

    const updateRes = await fetch(`${BASE_URL}/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Renamed Campaign" }),
    });
    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();
    expect(updated.name).toBe("Renamed Campaign");

    await fetch(`${BASE_URL}/campaigns/${campaign.id}/send`, { method: "POST" });

    const conflictRes = await fetch(`${BASE_URL}/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Should Not Apply" }),
    });
    expect(conflictRes.status).toBe(409);
  });
});

describe("POST /campaigns/:id/schedule (T18)", () => {
  it("transitions Draft to Scheduled and stores scheduledAt, rejecting a non-Draft campaign", async () => {
    const campaign = await createCampaign({ name: "Schedulable Campaign" });
    const future = new Date(Date.now() + 60_000).toISOString();

    const res = await fetch(`${BASE_URL}/campaigns/${campaign.id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: future }),
    });
    expect(res.status).toBe(200);
    const scheduled = await res.json();
    expect(scheduled.status).toBe("Scheduled");
    expect(scheduled.scheduledAt).toBe(future);

    const rejectRes = await fetch(`${BASE_URL}/campaigns/${campaign.id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: future }),
    });
    expect(rejectRes.status).toBe(409);
  });
});

describe("POST /campaigns/:id/send (T19)", () => {
  it("transitions a Draft campaign to Sent and sets sentAt when recipients resolve via overlapping target groups", async () => {
    const contactA = await createContact();
    const contactB = await createContact();
    const groupA = await createGroup({
      name: `Send Group A ${crypto.randomUUID()}`,
      contactIds: [contactA.id, contactB.id],
    });
    const groupB = await createGroup({ name: `Send Group B ${crypto.randomUUID()}`, contactIds: [contactB.id] });
    const campaign = await createCampaign({ name: "Ready To Send", targetGroupIds: [groupA.id, groupB.id] });

    const res = await fetch(`${BASE_URL}/campaigns/${campaign.id}/send`, { method: "POST" });

    expect(res.status).toBe(200);
    const sent = await res.json();
    expect(sent.status).toBe("Sent");
    expect(sent.sentAt).toBeTruthy();
  });
});

describe("POST /campaigns/:id/send with no resolved recipients (T20)", () => {
  it("transitions to Failed and dispatches no email", async () => {
    const emptyGroup = await createGroup();
    const campaign = await createCampaign({ name: "No Recipients Campaign", targetGroupIds: [emptyGroup.id] });

    const res = await fetch(`${BASE_URL}/campaigns/${campaign.id}/send`, { method: "POST" });

    expect(res.status).toBe(200);
    const failed = await res.json();
    expect(failed.status).toBe("Failed");
    expect(failed.sentAt).toBeNull();
  });
});

describe("POST /campaigns/:id/duplicate (T21)", () => {
  it("returns 201 with a new Draft campaign copying subject/body/targetGroupIds and no send history", async () => {
    const group = await createGroup();
    const original = await createCampaign({
      name: "Original Campaign",
      subject: "Original Subject",
      body: "Original Body {{name}}",
      targetGroupIds: [group.id],
    });
    await fetch(`${BASE_URL}/campaigns/${original.id}/send`, { method: "POST" });

    const res = await fetch(`${BASE_URL}/campaigns/${original.id}/duplicate`, { method: "POST" });

    expect(res.status).toBe(201);
    const duplicate = await res.json();
    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.subject).toBe("Original Subject");
    expect(duplicate.body).toBe("Original Body {{name}}");
    expect(duplicate.targetGroupIds).toEqual([group.id]);
    expect(duplicate.status).toBe("Draft");
    expect(duplicate.scheduledAt).toBeNull();
    expect(duplicate.sentAt).toBeNull();
  });
});

describe("Scheduled campaign automatic processing (T22)", () => {
  it("is automatically transitioned to Sent by the in-process scheduler within a bounded wait, without an explicit send call", async () => {
    const contact = await createContact();
    const group = await createGroup({ contactIds: [contact.id] });
    const campaign = await createCampaign({ name: "Auto Processed Campaign", targetGroupIds: [group.id] });
    const nearImmediate = new Date(Date.now() + 500).toISOString();

    const scheduleRes = await fetch(`${BASE_URL}/campaigns/${campaign.id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: nearImmediate }),
    });
    expect(scheduleRes.status).toBe(200);

    const deadline = Date.now() + 5000;
    let finalStatus = "Scheduled";
    while (Date.now() < deadline) {
      const res = await fetch(`${BASE_URL}/campaigns/${campaign.id}`);
      const current = await res.json();
      finalStatus = current.status;
      if (finalStatus === "Sent") break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    expect(finalStatus).toBe("Sent");
  }, 10000);
});

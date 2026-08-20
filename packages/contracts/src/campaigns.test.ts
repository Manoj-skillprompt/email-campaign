import { describe, expect, it } from "vitest";

import { createCampaignInputSchema, scheduleCampaignInputSchema, updateCampaignInputSchema } from "./campaigns";

const validInput = {
  name: "Welcome Series",
  subject: "Welcome!",
  body: "Hi {{name}}, welcome.",
  targetGroupIds: ["g1"],
};

describe("createCampaignInputSchema (T11)", () => {
  it("accepts a valid input without a sender (defaults applied by the service layer)", () => {
    const result = createCampaignInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts a valid input with a sender", () => {
    const result = createCampaignInputSchema.safeParse({ ...validInput, sender: "team@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = createCampaignInputSchema.safeParse({ ...validInput, name: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects an empty subject", () => {
    const result = createCampaignInputSchema.safeParse({ ...validInput, subject: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty body", () => {
    const result = createCampaignInputSchema.safeParse({ ...validInput, body: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty targetGroupIds array", () => {
    const result = createCampaignInputSchema.safeParse({ ...validInput, targetGroupIds: [] });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid sender email format", () => {
    const result = createCampaignInputSchema.safeParse({ ...validInput, sender: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("updateCampaignInputSchema (T11)", () => {
  it("accepts a partial update", () => {
    const result = updateCampaignInputSchema.safeParse({ name: "Renamed" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object", () => {
    const result = updateCampaignInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an empty targetGroupIds array when supplied", () => {
    const result = updateCampaignInputSchema.safeParse({ targetGroupIds: [] });
    expect(result.success).toBe(false);
  });
});

describe("scheduleCampaignInputSchema (T11)", () => {
  it("accepts a valid scheduledAt", () => {
    const result = scheduleCampaignInputSchema.safeParse({ scheduledAt: "2026-09-01T00:00:00.000Z" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing scheduledAt", () => {
    const result = scheduleCampaignInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

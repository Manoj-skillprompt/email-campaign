import { describe, expect, it } from "vitest";

import { createGroupInputSchema, updateGroupInputSchema } from "./groups";

describe("createGroupInputSchema (T7)", () => {
  it("accepts a valid input", () => {
    const result = createGroupInputSchema.safeParse({ name: "VIP Customers" });
    expect(result.success).toBe(true);
  });

  it("accepts a valid input with contactIds", () => {
    const result = createGroupInputSchema.safeParse({ name: "VIP Customers", contactIds: ["c1", "c2"] });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = createGroupInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = createGroupInputSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["name"]);
    }
  });

  it("rejects a whitespace-only name", () => {
    const result = createGroupInputSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });
});

describe("updateGroupInputSchema (T7)", () => {
  it("accepts a partial update", () => {
    const result = updateGroupInputSchema.safeParse({ addContactIds: ["c1"] });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object", () => {
    const result = updateGroupInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an empty name when name is supplied", () => {
    const result = updateGroupInputSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

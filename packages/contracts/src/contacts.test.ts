import { describe, expect, it } from "vitest";

import { createContactInputSchema, updateContactInputSchema } from "./contacts";

describe("createContactInputSchema (T5)", () => {
  it("accepts a valid input", () => {
    const result = createContactInputSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      branch: "London",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = createContactInputSchema.safeParse({
      name: "",
      email: "ada@example.com",
      branch: "London",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["name"]);
    }
  });

  it("rejects a missing email", () => {
    const result = createContactInputSchema.safeParse({
      name: "Ada Lovelace",
      email: "",
      branch: "London",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid email format", () => {
    const result = createContactInputSchema.safeParse({
      name: "Ada Lovelace",
      email: "not-an-email",
      branch: "London",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["email"]);
    }
  });

  it("rejects a missing branch", () => {
    const result = createContactInputSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      branch: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["branch"]);
    }
  });
});

describe("updateContactInputSchema (T5)", () => {
  it("accepts a partial update", () => {
    const result = updateContactInputSchema.safeParse({ branch: "Cambridge" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object", () => {
    const result = updateContactInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email format when email is supplied", () => {
    const result = updateContactInputSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { listContactsQuerySchema } from "./index";

describe("listContactsQuerySchema", () => {
  it("applies default page 1 and pageSize 10 when omitted", () => {
    const result = listContactsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
  });

  it("accepts valid page and pageSize values", () => {
    const result = listContactsQuerySchema.parse({ page: "3", pageSize: "25" });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(25);
  });

  it.each([0, -1, 1.5, "abc"])("rejects an invalid page value: %s", (page) => {
    expect(() => listContactsQuerySchema.parse({ page })).toThrow();
  });

  it.each([0, -1, 101, 1.5, "abc"])("rejects an invalid pageSize value: %s", (pageSize) => {
    expect(() => listContactsQuerySchema.parse({ pageSize })).toThrow();
  });

  it("accepts pageSize at the boundaries 1 and 100", () => {
    expect(listContactsQuerySchema.parse({ pageSize: 1 }).pageSize).toBe(1);
    expect(listContactsQuerySchema.parse({ pageSize: 100 }).pageSize).toBe(100);
  });
});

import type { Contact } from "@email-campaign-v2/contracts";
import { describe, expect, it } from "vitest";

import { paginate } from "./use-contacts";

function makeContacts(count: number): Contact[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    clientId: String(1000 + index),
    name: `Contact ${index}`,
    email: `contact${index}@example.com`,
    branch: "Kathmandu",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  }));
}

describe("paginate", () => {
  it("slices the requested page and reports total/totalPages", () => {
    const result = paginate(makeContacts(25), 2, 10);
    expect(result.data).toHaveLength(10);
    expect(result.data[0].id).toBe("10");
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
  });

  it("returns an empty data array, not an error, for a page beyond totalPages", () => {
    const result = paginate(makeContacts(5), 9, 10);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(1);
  });

  it("reports totalPages 0 when there are no contacts", () => {
    const result = paginate([], 1, 10);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});

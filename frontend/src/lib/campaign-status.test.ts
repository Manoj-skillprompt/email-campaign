import { describe, expect, it } from "vitest";

import { matchesStatusTab } from "./campaign-status";
import type { CampaignStatus } from "@/types/campaign";

describe("matchesStatusTab (T24)", () => {
  it("matches every status under the All tab", () => {
    const statuses: CampaignStatus[] = ["Draft", "Scheduled", "Sending", "Sent", "Failed", "Cancelled"];
    for (const status of statuses) {
      expect(matchesStatusTab(status, "All")).toBe(true);
    }
  });

  it("filters to only Draft campaigns under the Drafts tab", () => {
    expect(matchesStatusTab("Draft", "Drafts")).toBe(true);
    expect(matchesStatusTab("Scheduled", "Drafts")).toBe(false);
    expect(matchesStatusTab("Sent", "Drafts")).toBe(false);
  });

  it("filters to only Scheduled campaigns under the Scheduled tab", () => {
    expect(matchesStatusTab("Scheduled", "Scheduled")).toBe(true);
    expect(matchesStatusTab("Draft", "Scheduled")).toBe(false);
  });

  it("filters to only Sent campaigns under the Sent tab", () => {
    expect(matchesStatusTab("Sent", "Sent")).toBe(true);
    expect(matchesStatusTab("Sending", "Sent")).toBe(false);
    expect(matchesStatusTab("Failed", "Sent")).toBe(false);
  });
});

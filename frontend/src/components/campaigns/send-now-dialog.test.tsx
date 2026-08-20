import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Group } from "@email-campaign-v2/contracts";

import { SendNowDialog } from "./send-now-dialog";

const GROUPS: Group[] = [
  {
    id: "g1",
    name: "Group A",
    contactCount: 2,
    contactIds: ["c1", "c2"],
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
  },
  {
    id: "g2",
    name: "Group B",
    contactCount: 2,
    contactIds: ["c2", "c3"],
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
  },
];

describe("SendNowDialog (T29)", () => {
  it("displays the campaign name and the deduplicated resolved recipient count", () => {
    render(
      <SendNowDialog
        open
        campaignName="Welcome Series"
        targetGroupIds={["g1", "g2"]}
        targetGroups={GROUPS}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    // c1, c2, c3 deduplicated across groups g1 and g2 = 3 recipients.
    expect(screen.getByRole("dialog")).toHaveTextContent("Welcome Series");
    expect(screen.getByRole("dialog")).toHaveTextContent("3 recipients");
  });

  it("disables Send Now when the resolved recipient count is zero", () => {
    render(
      <SendNowDialog
        open
        campaignName="Empty Campaign"
        targetGroupIds={[]}
        targetGroups={GROUPS}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Send Now" })).toBeDisabled();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Group } from "@email-campaign-v2/contracts";

import { CampaignTable } from "./campaign-table";
import type { Campaign } from "@/types/campaign";

const GROUPS: Group[] = [
  {
    id: "g1",
    name: "Newsletter Subscribers",
    contactCount: 2,
    contactIds: ["c1", "c2"],
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
  },
  {
    id: "g2",
    name: "VIP Customers",
    contactCount: 1,
    contactIds: ["c3"],
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
  },
];

function buildCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: "camp1",
    name: "Welcome Series",
    subject: "Welcome!",
    sender: "team@example.com",
    body: "Hi {{name}}",
    targetGroupIds: ["g1"],
    status: "Draft",
    scheduledAt: null,
    sentAt: null,
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
    ...overrides,
  };
}

describe("CampaignTable (T23)", () => {
  it("renders Name, Status, and Target Groups per campaign", () => {
    const campaigns = [
      buildCampaign({ id: "camp1", name: "Welcome Series", status: "Draft", targetGroupIds: ["g1"] }),
      buildCampaign({ id: "camp2", name: "VIP Update", status: "Sent", targetGroupIds: ["g1", "g2"] }),
    ];

    render(<CampaignTable campaigns={campaigns} targetGroups={GROUPS} onOpen={vi.fn()} onDuplicate={vi.fn()} />);

    expect(screen.getByText("Welcome Series")).toBeInTheDocument();
    expect(screen.getByText("VIP Update")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
    expect(screen.getByText("SENT")).toBeInTheDocument();
    expect(screen.getByText("Newsletter Subscribers")).toBeInTheDocument();
    expect(screen.getByText("Newsletter Subscribers, VIP Customers")).toBeInTheDocument();
  });
});

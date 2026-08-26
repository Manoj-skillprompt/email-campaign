import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CampaignWithAudience } from "../campaign.types";
import { CampaignTable } from "./campaign-table";

const campaigns: CampaignWithAudience[] = [
  {
    id: "1",
    name: "Scheduled Campaign",
    subject: "Subject",
    senderEmail: "info@skillprompt.com",
    type: "EMAIL",
    groupIds: ["group-1"],
    content: "",
    status: "SCHEDULED",
    scheduledAt: "2026-07-23T00:00:00.000Z",
    sentAt: null,
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
    audienceLabel: "VIP Customers",
  },
  {
    id: "2",
    name: "Sent Campaign",
    subject: "Subject",
    senderEmail: "info@skillprompt.com",
    type: "EMAIL",
    groupIds: ["group-1"],
    content: "",
    status: "SENT",
    scheduledAt: null,
    sentAt: "2026-07-16T00:00:00.000Z",
    sentCount: 7,
    openRate: 12.5,
    clickRate: 3.4,
    createdAt: "2026-07-16T00:00:00.000Z",
    updatedAt: "2026-07-16T00:00:00.000Z",
    audienceLabel: "VIP Customers",
  },
];

describe("CampaignTable", () => {
  it("renders Campaign, Type, Audience, Status, Sent, Open Rate, Click Rate, and Date for every campaign", () => {
    render(<CampaignTable campaigns={campaigns} onOpen={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Scheduled Campaign")).toBeInTheDocument();
    expect(screen.getByText("SCHEDULED")).toBeInTheDocument();
    expect(screen.getAllByText("EMAIL")).toHaveLength(2);
    expect(screen.getAllByText("VIP Customers")).toHaveLength(2);

    expect(screen.getByText("Sent Campaign")).toBeInTheDocument();
    expect(screen.getByText("SENT")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("12.5%")).toBeInTheDocument();
    expect(screen.getByText("3.4%")).toBeInTheDocument();
  });

  it("shows — placeholders for Sent, Open Rate, and Click Rate on unsent campaigns", () => {
    render(<CampaignTable campaigns={[campaigns[0]!]} onOpen={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("invokes onOpen when the campaign name is clicked", () => {
    const onOpen = vi.fn();
    render(<CampaignTable campaigns={campaigns} onOpen={onOpen} onDelete={vi.fn()} />);

    fireEvent.click(screen.getByText("Scheduled Campaign"));

    expect(onOpen).toHaveBeenCalledWith(campaigns[0]);
  });

  it("invokes onDelete when the delete action is clicked", () => {
    const onDelete = vi.fn();
    render(<CampaignTable campaigns={campaigns} onOpen={vi.fn()} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Sent Campaign" }));

    expect(onDelete).toHaveBeenCalledWith(campaigns[1]);
  });
});

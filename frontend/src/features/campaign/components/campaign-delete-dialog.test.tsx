import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Campaign } from "../campaign.types";
import { CampaignDeleteDialog } from "./campaign-delete-dialog";

const campaign: Campaign = {
  id: "1",
  name: "VIP Announcement",
  subject: "Subject",
  senderEmail: "info@skillprompt.com",
  type: "EMAIL",
  groupIds: [],
  content: "",
  status: "DRAFT",
  scheduledAt: null,
  sentAt: null,
  sentCount: 0,
  openRate: 0,
  clickRate: 0,
  createdAt: "2026-07-20T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
};

describe("CampaignDeleteDialog", () => {
  it("calls onConfirm with the campaign when Delete is clicked", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    render(<CampaignDeleteDialog campaign={campaign} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledWith(campaign);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("closes without confirming when Cancel is clicked", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(<CampaignDeleteDialog campaign={campaign} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("is closed when no campaign is pending deletion", () => {
    render(<CampaignDeleteDialog campaign={null} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.queryByText("Delete Campaign")).not.toBeInTheDocument();
  });
});

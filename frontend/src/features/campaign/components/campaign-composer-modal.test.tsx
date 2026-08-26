import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Campaign } from "../campaign.types";
import { CampaignComposerModal } from "./campaign-composer-modal";

vi.mock("@/features/groups/use-groups", () => ({
  useGroupsQuery: () => ({
    data: {
      body: [
        {
          id: "group-1",
          name: "VIP Customers",
          contactIds: [],
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    },
  }),
}));

const sentCampaign: Campaign = {
  id: "sent-1",
  name: "Already Sent",
  subject: "Subject",
  senderEmail: "info@skillprompt.com",
  type: "EMAIL",
  groupIds: ["group-1"],
  content: "Hello",
  status: "SENT",
  scheduledAt: null,
  sentAt: "2026-07-16T00:00:00.000Z",
  sentCount: 7,
  openRate: 0,
  clickRate: 0,
  createdAt: "2026-07-16T00:00:00.000Z",
  updatedAt: "2026-07-16T00:00:00.000Z",
};

describe("CampaignComposerModal", () => {
  it("saves a draft with only a name, without requiring subject/sender/groups", async () => {
    const onSaveDraft = vi.fn().mockResolvedValue({ ...sentCampaign, status: "DRAFT", id: "new-id" });
    render(
      <CampaignComposerModal
        open
        campaign={null}
        onOpenChange={vi.fn()}
        onSaveDraft={onSaveDraft}
        onSchedule={vi.fn()}
        onSendNow={vi.fn()}
        onTrash={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Campaign name"), { target: { value: "Draft Only Name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(onSaveDraft).toHaveBeenCalledWith(null, {
      name: "Draft Only Name",
      subject: "",
      senderEmail: "",
      groupIds: [],
      content: "",
    });
  });

  it("blocks Send now and shows an error when required fields are incomplete", async () => {
    const onSendNow = vi.fn();
    render(
      <CampaignComposerModal
        open
        campaign={null}
        onOpenChange={vi.fn()}
        onSaveDraft={vi.fn()}
        onSchedule={vi.fn()}
        onSendNow={onSendNow}
        onTrash={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Campaign name"), { target: { value: "Incomplete Campaign" } });
    fireEvent.click(screen.getByRole("button", { name: "Send now" }));

    expect(
      await screen.findByText("Name, subject, sender, and at least one group are required to send a campaign.")
    ).toBeInTheDocument();
    expect(onSendNow).not.toHaveBeenCalled();
  });

  it("surfaces a server-side error when Send now fails for a fully valid campaign, and keeps the modal open", async () => {
    const onOpenChange = vi.fn();
    const onSendNow = vi
      .fn()
      .mockRejectedValue({ status: 500, body: { message: "Could not reach the email provider." } });
    render(
      <CampaignComposerModal
        open
        campaign={null}
        onOpenChange={onOpenChange}
        onSaveDraft={vi.fn()}
        onSchedule={vi.fn()}
        onSendNow={onSendNow}
        onTrash={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Campaign name"), { target: { value: "Complete Campaign" } });
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "Hello" } });
    fireEvent.change(screen.getByLabelText("Sender"), { target: { value: "info@skillprompt.com" } });
    fireEvent.change(screen.getByLabelText("Add group to audience"), { target: { value: "group-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Send now" }));

    expect(await screen.findByText("Could not reach the email provider.")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("blocks Schedule for later and shows an error when required fields are incomplete", async () => {
    const onSchedule = vi.fn();
    render(
      <CampaignComposerModal
        open
        campaign={null}
        onOpenChange={vi.fn()}
        onSaveDraft={vi.fn()}
        onSchedule={onSchedule}
        onSendNow={vi.fn()}
        onTrash={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Campaign name"), { target: { value: "Incomplete Campaign" } });
    fireEvent.click(screen.getByRole("button", { name: "Schedule for later" }));
    fireEvent.change(screen.getByLabelText("Scheduled date and time"), { target: { value: "2026-12-25T09:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm Schedule" }));

    expect(
      await screen.findByText("Name, subject, sender, and at least one group are required to schedule a campaign.")
    ).toBeInTheDocument();
    expect(onSchedule).not.toHaveBeenCalled();
  });

  it("renders fully disabled with no footer actions for a SENT campaign", () => {
    render(
      <CampaignComposerModal
        open
        campaign={sentCampaign}
        onOpenChange={vi.fn()}
        onSaveDraft={vi.fn()}
        onSchedule={vi.fn()}
        onSendNow={vi.fn()}
        onTrash={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Campaign name")).toBeDisabled();
    expect(screen.getByLabelText("Subject")).toBeDisabled();
    expect(screen.getByLabelText("Sender")).toBeDisabled();
    expect(screen.getByLabelText("Email body")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save draft" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Schedule for later" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send now" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Trash" })).not.toBeInTheDocument();
  });
});

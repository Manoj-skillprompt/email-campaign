import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Group } from "@email-campaign-v2/contracts";

import { CampaignEditorModal } from "./campaign-editor-modal";
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

describe("CampaignEditorModal validation (T27)", () => {
  it("blocks Save Draft on missing name/subject/body/targetGroupIds and preserves entered values", async () => {
    const onSaveDraft = vi.fn();

    render(
      <CampaignEditorModal
        open
        onOpenChange={vi.fn()}
        mode="create"
        targetGroups={GROUPS}
        onSaveDraft={onSaveDraft}
        onRequestSchedule={vi.fn()}
        onRequestSendNow={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Partially Filled" } });
    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(screen.getByText("Subject is required")).toBeInTheDocument();
    });
    expect(screen.getByText("Body is required")).toBeInTheDocument();
    expect(screen.getByText("Select at least one target group")).toBeInTheDocument();
    expect(onSaveDraft).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Name")).toHaveValue("Partially Filled");
  });

  it("calls onSaveDraft with valid values", async () => {
    const onSaveDraft = vi.fn().mockResolvedValue(undefined);

    render(
      <CampaignEditorModal
        open
        onOpenChange={vi.fn()}
        mode="create"
        targetGroups={GROUPS}
        onSaveDraft={onSaveDraft}
        onRequestSchedule={vi.fn()}
        onRequestSendNow={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "New Campaign" } });
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "Hello" } });
    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "Body text" } });
    fireEvent.click(screen.getByText("Newsletter Subscribers"));
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(onSaveDraft).toHaveBeenCalledWith(
        expect.objectContaining({ name: "New Campaign", subject: "Hello", body: "Body text", targetGroupIds: ["g1"] })
      );
    });
  });
});

describe("CampaignEditorModal read-only state (T28)", () => {
  it("renders read-only/disabled when the loaded campaign's status is not Draft", () => {
    const campaign = buildCampaign({ status: "Sent" });

    render(
      <CampaignEditorModal
        open
        onOpenChange={vi.fn()}
        mode="edit"
        campaign={campaign}
        targetGroups={GROUPS}
        onSaveDraft={vi.fn()}
        onRequestSchedule={vi.fn()}
        onRequestSendNow={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.getByLabelText("Subject")).toBeDisabled();
    expect(screen.getByLabelText("Sender")).toBeDisabled();
    expect(screen.getByLabelText("Body")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save draft" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send now" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("renders editable when the loaded campaign's status is Draft", () => {
    const campaign = buildCampaign({ status: "Draft" });

    render(
      <CampaignEditorModal
        open
        onOpenChange={vi.fn()}
        mode="edit"
        campaign={campaign}
        targetGroups={GROUPS}
        onSaveDraft={vi.fn()}
        onRequestSchedule={vi.fn()}
        onRequestSendNow={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Name")).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeInTheDocument();
  });
});

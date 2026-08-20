import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CampaignStatusTabs } from "./campaign-status-tabs";

describe("CampaignStatusTabs (T24)", () => {
  it("renders All/Drafts/Scheduled/Sent tabs and calls onChange when a tab is clicked", () => {
    const onChange = vi.fn();
    render(<CampaignStatusTabs value="All" onChange={onChange} />);

    expect(screen.getByRole("button", { name: /All/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Drafts/ })).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: /Scheduled/ }));

    expect(onChange).toHaveBeenCalledWith("Scheduled");
  });
});

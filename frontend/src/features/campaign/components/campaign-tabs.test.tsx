import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CampaignTabs } from "./campaign-tabs";

describe("CampaignTabs", () => {
  it("renders All, Drafts, Scheduled, and Sent tabs", () => {
    render(<CampaignTabs value="ALL" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /All/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Drafts/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Scheduled/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sent/ })).toBeInTheDocument();
  });

  it("calls onChange with the status value when a tab is clicked", () => {
    const onChange = vi.fn();
    render(<CampaignTabs value="ALL" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /Drafts/ }));
    expect(onChange).toHaveBeenCalledWith("DRAFT");

    fireEvent.click(screen.getByRole("button", { name: /Scheduled/ }));
    expect(onChange).toHaveBeenCalledWith("SCHEDULED");

    fireEvent.click(screen.getByRole("button", { name: /Sent/ }));
    expect(onChange).toHaveBeenCalledWith("SENT");

    fireEvent.click(screen.getByRole("button", { name: /All/ }));
    expect(onChange).toHaveBeenCalledWith("ALL");
  });
});

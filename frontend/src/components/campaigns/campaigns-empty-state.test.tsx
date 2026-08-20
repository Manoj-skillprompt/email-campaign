import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CampaignsEmptyState } from "./campaigns-empty-state";

describe("CampaignsEmptyState (T26)", () => {
  it("renders with a primary New Campaign action that triggers the callback", () => {
    const onCreateCampaign = vi.fn();

    render(<CampaignsEmptyState onCreateCampaign={onCreateCampaign} />);

    expect(screen.getByText("No campaigns found")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "New Campaign" });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onCreateCampaign).toHaveBeenCalledTimes(1);
  });
});

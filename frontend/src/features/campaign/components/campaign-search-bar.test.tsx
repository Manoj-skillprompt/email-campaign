import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CampaignSearchBar } from "./campaign-search-bar";

// Filtering is performed server-side (via the search query param); this component
// only needs to behave as a faithful controlled input.
describe("CampaignSearchBar", () => {
  it("renders the current value and placeholder", () => {
    render(<CampaignSearchBar value="newsletter" onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText("Search campaigns...");
    expect(input).toHaveValue("newsletter");
  });

  it("calls onChange with the typed value, preserving case", () => {
    const onChange = vi.fn();
    render(<CampaignSearchBar value="" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText("Search campaigns..."), {
      target: { value: "VIP Announcement" },
    });

    expect(onChange).toHaveBeenCalledWith("VIP Announcement");
  });
});

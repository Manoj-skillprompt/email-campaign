import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContactSearchBar } from "./contact-search-bar";

// Filtering is performed server-side (via the search query param) since Integration build;
// this component only needs to behave as a faithful controlled input.
describe("ContactSearchBar", () => {
  it("renders the current value and placeholder", () => {
    render(<ContactSearchBar value="kathmandu" onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText("Search contacts...");
    expect(input).toHaveValue("kathmandu");
  });

  it("calls onChange with the typed value, preserving case", () => {
    const onChange = vi.fn();
    render(<ContactSearchBar value="" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText("Search contacts..."), {
      target: { value: "Kathmandu" },
    });

    expect(onChange).toHaveBeenCalledWith("Kathmandu");
  });
});

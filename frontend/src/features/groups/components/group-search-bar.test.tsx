import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GroupSearchBar } from "./group-search-bar";

// Filtering is performed server-side (via the search query param); this component
// only needs to behave as a faithful controlled input.
describe("GroupSearchBar", () => {
  it("renders the current value and placeholder", () => {
    render(<GroupSearchBar value="vip" onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText("Search groups...");
    expect(input).toHaveValue("vip");
  });

  it("calls onChange with the typed value, preserving case", () => {
    const onChange = vi.fn();
    render(<GroupSearchBar value="" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText("Search groups..."), {
      target: { value: "VIP Customers" },
    });

    expect(onChange).toHaveBeenCalledWith("VIP Customers");
  });
});

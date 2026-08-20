import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GroupSearch } from "./group-search";

describe("GroupSearch (T16)", () => {
  it("calls onChange on every keystroke without navigating", () => {
    const onChange = vi.fn();
    render(<GroupSearch value="" onChange={onChange} />);

    const input = screen.getByLabelText("Search groups");
    fireEvent.change(input, { target: { value: "VIP" } });

    expect(onChange).toHaveBeenCalledWith("VIP");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("reflects the current value as a controlled input", () => {
    render(<GroupSearch value="Newsletter" onChange={vi.fn()} />);

    expect(screen.getByLabelText("Search groups")).toHaveValue("Newsletter");
  });
});

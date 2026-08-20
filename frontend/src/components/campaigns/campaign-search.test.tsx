import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CampaignSearch } from "./campaign-search";

describe("CampaignSearch (T25)", () => {
  it("calls onChange on every keystroke without navigating", () => {
    const onChange = vi.fn();
    render(<CampaignSearch value="" onChange={onChange} />);

    const input = screen.getByLabelText("Search campaigns");
    fireEvent.change(input, { target: { value: "Welcome" } });

    expect(onChange).toHaveBeenCalledWith("Welcome");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("reflects the current value as a controlled input", () => {
    render(<CampaignSearch value="VIP Update" onChange={vi.fn()} />);

    expect(screen.getByLabelText("Search campaigns")).toHaveValue("VIP Update");
  });
});

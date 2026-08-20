import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GroupsEmptyState } from "./groups-empty-state";

describe("GroupsEmptyState (T17)", () => {
  it("renders with a primary Create Group action that triggers the callback", () => {
    const onCreateGroup = vi.fn();

    render(<GroupsEmptyState onCreateGroup={onCreateGroup} />);

    expect(screen.getByText("No groups found")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Create Group" });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onCreateGroup).toHaveBeenCalledTimes(1);
  });
});

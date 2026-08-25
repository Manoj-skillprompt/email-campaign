import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Group } from "../group.types";
import { GroupDeleteDialog } from "./group-delete-dialog";

const group: Group = {
  id: "1",
  name: "VIP Customers",
  contactIds: ["contact-1"],
  createdAt: "2026-07-20T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
};

describe("GroupDeleteDialog", () => {
  it("calls onConfirm with the group when Delete is clicked", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    render(<GroupDeleteDialog group={group} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledWith(group);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("closes without confirming when Cancel is clicked", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(<GroupDeleteDialog group={group} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("is closed when no group is pending deletion", () => {
    render(<GroupDeleteDialog group={null} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.queryByText("Delete Group")).not.toBeInTheDocument();
  });
});

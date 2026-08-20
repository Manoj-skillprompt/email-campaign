import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeleteGroupDialog } from "./delete-group-dialog";
import type { Group } from "@/types/group";

const GROUP: Group = {
  id: "g1",
  name: "VIP Customers",
  contactCount: 2,
  contactIds: ["c1", "c2"],
  createdAt: "2026-07-20T12:00:00.000Z",
  updatedAt: "2026-07-20T12:00:00.000Z",
};

describe("DeleteGroupDialog (T20)", () => {
  it("calls onConfirm with the group when Delete is confirmed", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(<DeleteGroupDialog group={GROUP} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    expect(screen.getByText(/permanently remove the group "VIP Customers"/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledWith(GROUP);
  });

  it("takes no action on the group when Cancel is clicked", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(<DeleteGroupDialog group={GROUP} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render dialog content when group is null", () => {
    render(<DeleteGroupDialog group={null} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.queryByText("Delete Group")).not.toBeInTheDocument();
  });
});

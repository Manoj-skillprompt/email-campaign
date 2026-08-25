import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { GroupWithMembers } from "../group.types";
import { GroupGrid } from "./group-grid";

const groups: GroupWithMembers[] = [
  {
    id: "1",
    name: "VIP Customers",
    contactIds: ["c1", "c2"],
    members: [
      { id: "c1", name: "Ada Lovelace" },
      { id: "c2", name: "Grace Hopper" },
    ],
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Newsletter Subscribers",
    contactIds: [],
    members: [],
    createdAt: "2026-07-10T00:00:00.000Z",
    updatedAt: "2026-07-10T00:00:00.000Z",
  },
];

describe("GroupGrid", () => {
  it("renders each group's name, contact count, and avatar initials", () => {
    render(<GroupGrid groups={groups} onEdit={vi.fn()} onDelete={vi.fn()} onManage={vi.fn()} />);

    expect(screen.getByText("VIP Customers")).toBeInTheDocument();
    expect(screen.getByText("2 contacts matched")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();

    expect(screen.getByText("Newsletter Subscribers")).toBeInTheDocument();
    expect(screen.getByText("0 contacts matched")).toBeInTheDocument();
  });

  it("invokes onManage when Manage Group is clicked", () => {
    const onManage = vi.fn();
    render(<GroupGrid groups={groups} onEdit={vi.fn()} onDelete={vi.fn()} onManage={onManage} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Manage Group" })[0]!);

    expect(onManage).toHaveBeenCalledWith(groups[0]);
  });

  it("invokes onEdit and onDelete from the overflow menu", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<GroupGrid groups={groups} onEdit={onEdit} onDelete={onDelete} onManage={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "More actions for VIP Customers" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith(groups[0]);

    fireEvent.click(screen.getByRole("button", { name: "More actions for Newsletter Subscribers" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(groups[1]);
  });
});

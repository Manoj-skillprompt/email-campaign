import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Group } from "../group.types";
import { GroupFormModal } from "./group-form-modal";

const group: Group = {
  id: "1",
  name: "VIP Customers",
  contactIds: [],
  createdAt: "2026-07-20T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
};

describe("GroupFormModal", () => {
  it("blocks submission and shows a validation error when the name is empty", async () => {
    const onSubmit = vi.fn();
    render(<GroupFormModal open mode="create" onOpenChange={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("preserves the entered value when validation fails", async () => {
    const onSubmit = vi.fn();
    render(<GroupFormModal open mode="edit" group={group} onOpenChange={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Group Name"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("populates the name field from the group when editing", () => {
    render(<GroupFormModal open mode="edit" group={group} onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Group Name")).toHaveValue("VIP Customers");
    expect(screen.getByText("Edit Group")).toBeInTheDocument();
  });

  it("submits valid data", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GroupFormModal open mode="edit" group={group} onOpenChange={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Group Name"), { target: { value: "Renamed Group" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: "Renamed Group" }));
  });

  it("surfaces a server-side conflict error on the name field without losing the entered value", async () => {
    const onSubmit = vi.fn().mockRejectedValue({ status: 409, body: { message: "Group name already exists." } });
    render(<GroupFormModal open mode="edit" group={group} onOpenChange={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Group Name"), { target: { value: "Duplicate Name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Group name already exists.")).toBeInTheDocument();
    expect(screen.getByLabelText("Group Name")).toHaveValue("Duplicate Name");
  });
});

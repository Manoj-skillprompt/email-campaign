import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GroupFormModal } from "./group-form-modal";
import { GroupFieldError } from "@/lib/group-form-errors";
import type { Contact } from "@/types/contact";

const CONTACTS: Contact[] = [
  {
    id: "c1",
    clientId: "LOCAL-c1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    branch: "London",
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
  },
  {
    id: "c2",
    clientId: "LOCAL-c2",
    name: "Bob Test",
    email: "bob@example.com",
    branch: "Kathmandu",
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
  },
];

describe("GroupFormModal validation (T18)", () => {
  it("blocks submission and shows an error when the name is empty", async () => {
    const onSubmit = vi.fn();

    render(
      <GroupFormModal
        open
        onOpenChange={vi.fn()}
        mode="create"
        currentMemberIds={[]}
        allContacts={CONTACTS}
        existingNames={new Set()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Group" }));

    await waitFor(() => {
      expect(screen.getByText("Group name is required")).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks submission and shows an error when the name is a duplicate", async () => {
    const onSubmit = vi.fn();

    render(
      <GroupFormModal
        open
        onOpenChange={vi.fn()}
        mode="create"
        currentMemberIds={[]}
        allContacts={CONTACTS}
        existingNames={new Set(["vip customers"])}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText("Group Name"), { target: { value: "VIP Customers" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Group" }));

    await waitFor(() => {
      expect(screen.getByText("A group with this name already exists")).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("preserves the entered name and selected contacts after a validation error", async () => {
    render(
      <GroupFormModal
        open
        onOpenChange={vi.fn()}
        mode="create"
        currentMemberIds={[]}
        allContacts={CONTACTS}
        existingNames={new Set(["vip customers"])}
        onSubmit={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Group Name"), { target: { value: "VIP Customers" } });
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Save Group" }));

    await waitFor(() => {
      expect(screen.getByText("A group with this name already exists")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Group Name")).toHaveValue("VIP Customers");
    expect(screen.getAllByRole("checkbox")[0]).toBeChecked();
  });

  it("submits with selected contact ids and closes the modal when valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <GroupFormModal
        open
        onOpenChange={onOpenChange}
        mode="create"
        currentMemberIds={[]}
        allContacts={CONTACTS}
        existingNames={new Set()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText("Group Name"), { target: { value: "New Group" } });
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Save Group" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: "New Group", contactIds: ["c1"] });
    });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("maps a server-side field error onto the form without closing", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new GroupFieldError("name", "A group with this name already exists"));
    const onOpenChange = vi.fn();

    render(
      <GroupFormModal
        open
        onOpenChange={onOpenChange}
        mode="create"
        currentMemberIds={[]}
        allContacts={CONTACTS}
        existingNames={new Set()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText("Group Name"), { target: { value: "New Group" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Group" }));

    await waitFor(() => {
      expect(screen.getByText("A group with this name already exists")).toBeInTheDocument();
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByLabelText("Group Name")).toHaveValue("New Group");
  });
});

describe("GroupFormModal contact multi-select (T19)", () => {
  it("does not allow the same contact to be selected twice", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <GroupFormModal
        open
        onOpenChange={vi.fn()}
        mode="create"
        currentMemberIds={[]}
        allContacts={CONTACTS}
        existingNames={new Set()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText("Group Name"), { target: { value: "New Group" } });
    const checkbox = screen.getAllByRole("checkbox")[0];

    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "Save Group" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: "New Group", contactIds: ["c1"] });
    });
  });
});

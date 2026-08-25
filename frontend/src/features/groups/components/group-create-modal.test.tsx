import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Contact } from "@/features/contacts/contact.types";

import { GroupCreateModal } from "./group-create-modal";

const useContactsQuery = vi.fn();

vi.mock("@/features/contacts/use-contacts", () => ({
  useContactsQuery: (search: string) => useContactsQuery(search),
}));

const alice: Contact = {
  id: "alice-id",
  clientId: "LOCAL-alice",
  name: "Alice Adams",
  email: "alice@example.com",
  branch: "London",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

async function advanceToManualSelection(name: string) {
  fireEvent.change(screen.getByLabelText("Group Name"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: "Configure Group →" }));
  await screen.findByText("Step 2 of 2: Manual Selection");
}

describe("GroupCreateModal", () => {
  beforeEach(() => {
    useContactsQuery.mockReset();
    useContactsQuery.mockReturnValue({ data: { body: [alice] } });
  });

  it("blocks progression to step 2 when the name is empty, and never calls onCreate", async () => {
    const onCreate = vi.fn();
    render(<GroupCreateModal open onOpenChange={vi.fn()} onCreate={onCreate} />);

    fireEvent.click(screen.getByRole("button", { name: "Configure Group →" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 2: Basics")).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("advances to step 2 with a valid name, without creating the group yet", async () => {
    const onCreate = vi.fn();
    render(<GroupCreateModal open onOpenChange={vi.fn()} onCreate={onCreate} />);

    await advanceToManualSelection("VIP Customers");

    expect(screen.getByText('Setup "VIP Customers"')).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("creates the group with no members only when Save Group is clicked", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<GroupCreateModal open onOpenChange={vi.fn()} onCreate={onCreate} />);

    await advanceToManualSelection("VIP Customers");
    expect(onCreate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save Group" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({ name: "VIP Customers", contactIds: [] }));
  });

  it("selecting a contact includes it in Save Group's payload and updates the assigned count", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<GroupCreateModal open onOpenChange={vi.fn()} onCreate={onCreate} />);

    await advanceToManualSelection("VIP Customers");

    fireEvent.click(screen.getByText("Alice Adams"));
    expect(screen.getByText("Group Assigned Contacts (1)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save Group" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({ name: "VIP Customers", contactIds: [alice.id] }));
  });

  it("closes without creating anything when Cancel is clicked on step 2", async () => {
    const onCreate = vi.fn();
    const onOpenChange = vi.fn();
    render(<GroupCreateModal open onOpenChange={onOpenChange} onCreate={onCreate} />);

    await advanceToManualSelection("VIP Customers");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCreate).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes without creating anything when the close icon is clicked on step 1", () => {
    const onCreate = vi.fn();
    const onOpenChange = vi.fn();
    render(<GroupCreateModal open onOpenChange={onOpenChange} onCreate={onCreate} />);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onCreate).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("routes a duplicate-name conflict back to step 1 with the error on the name field", async () => {
    const onCreate = vi.fn().mockRejectedValue({ status: 409, body: { message: "Group name already exists." } });
    render(<GroupCreateModal open onOpenChange={vi.fn()} onCreate={onCreate} />);

    await advanceToManualSelection("Duplicate Name");
    fireEvent.click(screen.getByRole("button", { name: "Save Group" }));

    expect(await screen.findByText("Group name already exists.")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 2: Basics")).toBeInTheDocument();
    expect(screen.getByLabelText("Group Name")).toHaveValue("Duplicate Name");
  });
});

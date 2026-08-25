import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Contact } from "../contact.types";
import { ContactDeleteDialog } from "./contact-delete-dialog";

const contact: Contact = {
  id: "1",
  clientId: "LOCAL-1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  branch: "London",
  createdAt: "2026-07-20T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
};

describe("ContactDeleteDialog", () => {
  it("calls onConfirm with the contact when Delete is clicked", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    render(<ContactDeleteDialog contact={contact} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledWith(contact);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("closes without confirming when Cancel is clicked", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(<ContactDeleteDialog contact={contact} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("is closed when no contact is pending deletion", () => {
    render(<ContactDeleteDialog contact={null} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.queryByText("Delete Contact")).not.toBeInTheDocument();
  });
});

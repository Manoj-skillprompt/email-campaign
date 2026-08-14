import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeleteContactDialog } from "./delete-contact-dialog";
import type { Contact } from "@/types/contact";

const CONTACT: Contact = {
  id: "1",
  clientId: "LOCAL-abc12345",
  name: "Ada Lovelace",
  email: "ada@example.com",
  branch: "London",
  createdAt: "2026-07-20T12:00:00.000Z",
  updatedAt: "2026-07-20T12:00:00.000Z",
};

describe("DeleteContactDialog (T15)", () => {
  it("calls onConfirm with the contact when Delete is confirmed", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(<DeleteContactDialog contact={CONTACT} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    expect(screen.getByText(/permanently remove Ada Lovelace/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledWith(CONTACT);
  });

  it("takes no action on the contact when Cancel is clicked", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(<DeleteContactDialog contact={CONTACT} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render dialog content when contact is null", () => {
    render(<DeleteContactDialog contact={null} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.queryByText("Delete Contact")).not.toBeInTheDocument();
  });
});

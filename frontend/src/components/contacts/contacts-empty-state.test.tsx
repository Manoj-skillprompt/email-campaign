import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContactsEmptyState } from "./contacts-empty-state";

describe("ContactsEmptyState (T13)", () => {
  it("renders with a primary Add Contact action that triggers the callback", () => {
    const onAddContact = vi.fn();

    render(<ContactsEmptyState onAddContact={onAddContact} />);

    expect(screen.getByText("No contacts found")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Add Contact" });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onAddContact).toHaveBeenCalledTimes(1);
  });
});

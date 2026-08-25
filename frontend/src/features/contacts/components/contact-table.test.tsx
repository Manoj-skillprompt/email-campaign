import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Contact } from "../contact.types";
import { ContactTable } from "./contact-table";

const contacts: Contact[] = [
  {
    id: "1",
    clientId: "LOCAL-1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    branch: "London",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "2",
    clientId: "LOCAL-2",
    name: "Grace Hopper",
    email: "grace@example.com",
    branch: "Arlington",
    createdAt: "2026-07-10T00:00:00.000Z",
    updatedAt: "2026-07-10T00:00:00.000Z",
  },
];

describe("ContactTable", () => {
  it("renders Client ID, Name, Email, Branch, and Date Added for every contact", () => {
    render(<ContactTable contacts={contacts} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("#LOCAL-1")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("London")).toBeInTheDocument();
    expect(screen.getByText("7/20/2026")).toBeInTheDocument();

    expect(screen.getByText("#LOCAL-2")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByText("grace@example.com")).toBeInTheDocument();
    expect(screen.getByText("Arlington")).toBeInTheDocument();
    expect(screen.getByText("7/10/2026")).toBeInTheDocument();
  });

  it("invokes onEdit and onDelete with the corresponding contact", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<ContactTable contacts={contacts} onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Ada Lovelace" }));
    expect(onEdit).toHaveBeenCalledWith(contacts[0]);

    fireEvent.click(screen.getByRole("button", { name: "Delete Grace Hopper" }));
    expect(onDelete).toHaveBeenCalledWith(contacts[1]);
  });
});

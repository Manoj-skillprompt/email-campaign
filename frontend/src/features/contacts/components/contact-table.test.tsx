import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ContactWithGroup } from "../contact.types";
import { ContactTable } from "./contact-table";

const contacts: ContactWithGroup[] = [
  {
    id: "1",
    clientId: "1234",
    name: "Ada Lovelace",
    email: "ada@example.com",
    branch: "London",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
    groupLabel: "VIP Customers",
  },
  {
    id: "2",
    clientId: "5678",
    name: "Grace Hopper",
    email: "grace@example.com",
    branch: "Arlington",
    createdAt: "2026-07-10T00:00:00.000Z",
    updatedAt: "2026-07-10T00:00:00.000Z",
    groupLabel: "—",
  },
];

describe("ContactTable", () => {
  it("renders Client ID, Name, Email, Branch, Group, and Date Added for every contact", () => {
    render(<ContactTable contacts={contacts} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("#1234")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("London")).toBeInTheDocument();
    expect(screen.getByText("VIP Customers")).toBeInTheDocument();
    expect(screen.getByText("7/20/2026")).toBeInTheDocument();

    expect(screen.getByText("#5678")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByText("grace@example.com")).toBeInTheDocument();
    expect(screen.getByText("Arlington")).toBeInTheDocument();
    expect(screen.getByText("7/10/2026")).toBeInTheDocument();
  });

  it("shows a dash in the Group column when a contact belongs to no group", () => {
    render(<ContactTable contacts={contacts} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("—")).toBeInTheDocument();
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

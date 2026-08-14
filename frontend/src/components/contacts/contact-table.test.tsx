import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContactTable } from "./contact-table";
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

describe("ContactTable (T11)", () => {
  it("renders Client ID, Name, Email, Branch, and Date Added columns", () => {
    render(<ContactTable contacts={[CONTACT]} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("CLIENT ID")).toBeInTheDocument();
    expect(screen.getByText("NAME")).toBeInTheDocument();
    expect(screen.getByText("EMAIL")).toBeInTheDocument();
    expect(screen.getByText("BRANCH")).toBeInTheDocument();
    expect(screen.getByText("DATE ADDED")).toBeInTheDocument();

    expect(screen.getByText(/LOCAL-abc12345/)).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("London")).toBeInTheDocument();
    expect(screen.getByText("7/20/2026")).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/ui/toast";
import type { Contact } from "@/features/contacts/contact.types";

import ContactsPage from "./page";

const usePaginatedContactsQuery = vi.fn();
const useGroupsQuery = vi.fn();
const mutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock("@/features/contacts/use-contacts", () => ({
  usePaginatedContactsQuery: (search: string, page: number) => usePaginatedContactsQuery(search, page),
  useCreateContactMutation: () => ({ mutateAsync }),
  useUpdateContactMutation: () => ({ mutateAsync }),
  useDeleteContactMutation: () => ({ mutateAsync }),
}));

vi.mock("@/features/groups/use-groups", () => ({
  useGroupsQuery: (search: string) => useGroupsQuery(search),
}));

function buildContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "1",
    clientId: "1234",
    name: "Ada Lovelace",
    email: "ada@example.com",
    branch: "London",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
    ...overrides,
  };
}

function renderPage() {
  return render(
    <ToastProvider>
      <ContactsPage />
    </ToastProvider>
  );
}

describe("ContactsPage", () => {
  beforeEach(() => {
    usePaginatedContactsQuery.mockReset();
    useGroupsQuery.mockReset();
    useGroupsQuery.mockReturnValue({ data: { body: [] } });
    usePaginatedContactsQuery.mockReturnValue({
      data: { body: { data: [buildContact()], page: 1, pageSize: 10, total: 25, totalPages: 3 } },
    });
  });

  it("shows the envelope's total count, not the current page's row count", () => {
    renderPage();

    expect(screen.getByText("25 total contacts found")).toBeInTheDocument();
  });

  it("requests the next page when Next is clicked, and resets to page 1 when the search term changes", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(usePaginatedContactsQuery).toHaveBeenLastCalledWith("", 2);

    fireEvent.change(screen.getByPlaceholderText("Search contacts..."), { target: { value: "kathmandu" } });
    expect(usePaginatedContactsQuery).toHaveBeenLastCalledWith("kathmandu", 1);
  });
});

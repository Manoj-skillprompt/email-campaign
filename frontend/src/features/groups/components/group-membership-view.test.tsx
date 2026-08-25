import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Contact } from "@/features/contacts/contact.types";

import type { GroupWithMembers } from "../group.types";
import { GroupMembershipView } from "./group-membership-view";

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

const bob: Contact = {
  id: "bob-id",
  clientId: "LOCAL-bob",
  name: "Bob Brown",
  email: "bob@example.com",
  branch: "Kathmandu",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const groupWithAlice: GroupWithMembers = {
  id: "group-1",
  name: "VIP Customers",
  contactIds: [alice.id],
  members: [{ id: alice.id, name: alice.name }],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("GroupMembershipView", () => {
  beforeEach(() => {
    useContactsQuery.mockReset();
    useContactsQuery.mockReturnValue({ data: { body: [alice, bob] } });
  });

  it("renders nothing when no group is being managed", () => {
    render(<GroupMembershipView group={null} onOpenChange={vi.fn()} onAssign={vi.fn()} onUnassign={vi.fn()} />);

    expect(screen.queryByText(/Manage/)).not.toBeInTheDocument();
  });

  it("lists current members as assigned and excludes them from the available list", () => {
    render(
      <GroupMembershipView group={groupWithAlice} onOpenChange={vi.fn()} onAssign={vi.fn()} onUnassign={vi.fn()} />
    );

    expect(screen.getByText('Manage "VIP Customers"')).toBeInTheDocument();
    expect(screen.getByText("Group Assigned Contacts (1)")).toBeInTheDocument();
    expect(screen.getByText("Alice Adams")).toBeInTheDocument();
    expect(screen.getByText("Available Contacts (1)")).toBeInTheDocument();
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
  });

  it("assigning an available contact moves it into the group and updates the counts", () => {
    const onAssign = vi.fn().mockResolvedValue(undefined);
    render(
      <GroupMembershipView group={groupWithAlice} onOpenChange={vi.fn()} onAssign={onAssign} onUnassign={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onAssign).toHaveBeenCalledWith("group-1", { id: bob.id, name: bob.name });
  });

  it("unassigning a member removes membership without deleting the contact", () => {
    const onUnassign = vi.fn().mockResolvedValue(undefined);
    render(
      <GroupMembershipView group={groupWithAlice} onOpenChange={vi.fn()} onAssign={vi.fn()} onUnassign={onUnassign} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(onUnassign).toHaveBeenCalledWith("group-1", alice.id);
  });

  it("shows the empty-state placeholder when the group has no members", () => {
    const emptyGroup: GroupWithMembers = { ...groupWithAlice, contactIds: [], members: [] };
    render(<GroupMembershipView group={emptyGroup} onOpenChange={vi.fn()} onAssign={vi.fn()} onUnassign={vi.fn()} />);

    expect(screen.getByText("Group is currently empty")).toBeInTheDocument();
  });
});

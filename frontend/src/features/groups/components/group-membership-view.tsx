"use client";

import { useMemo, useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useContactsQuery } from "@/features/contacts/use-contacts";

import type { GroupMember, GroupWithMembers } from "../group.types";

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

interface GroupMembershipViewProps {
  group: GroupWithMembers | null;
  onOpenChange: (open: boolean) => void;
  onAssign: (groupId: string, contact: GroupMember) => Promise<void>;
  onUnassign: (groupId: string, contactId: string) => Promise<void>;
}

export function GroupMembershipView({ group, onOpenChange, onAssign, onUnassign }: GroupMembershipViewProps) {
  const [search, setSearch] = useState("");
  const contactsQuery = useContactsQuery(search);
  const contacts = contactsQuery.data?.body ?? [];

  const memberIds = useMemo(() => new Set(group?.contactIds ?? []), [group]);
  const availableContacts = contacts.filter((contact) => !memberIds.has(contact.id));

  if (!group) {
    return null;
  }

  return (
    <Dialog open={group !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage &quot;{group.name}&quot;</DialogTitle>
        </DialogHeader>
        <div className="flex gap-8">
          <div className="flex w-[360px] flex-col gap-3">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search contacts..."
              aria-label="Search available contacts"
              className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none"
            />
            <p className="text-sm font-semibold text-foreground">Available Contacts ({availableContacts.length})</p>
            <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto">
              {availableContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {initialOf(contact.name)}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-foreground">{contact.name}</span>
                      <span className="text-[11px] text-foreground-muted">{contact.email}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAssign(group.id, { id: contact.id, name: contact.name })}
                    className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Add
                  </button>
                </div>
              ))}
              {availableContacts.length === 0 ? (
                <p className="py-6 text-center text-sm text-foreground-muted">No contacts available.</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">Group Assigned Contacts ({group.members.length})</p>
            {group.members.length > 0 ? (
              <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <span className="text-[13px] font-semibold text-foreground">{member.name}</span>
                    <button
                      type="button"
                      onClick={() => onUnassign(group.id, member.id)}
                      className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground-muted hover:bg-background"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[420px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background text-center">
                <p className="text-sm font-semibold text-foreground-muted">Group is currently empty</p>
                <p className="text-xs text-foreground-subtle">Add contacts from the list on the left.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

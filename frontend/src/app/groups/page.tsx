"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { DeleteGroupDialog } from "@/components/groups/delete-group-dialog";
import { GroupFormModal } from "@/components/groups/group-form-modal";
import { GroupGrid } from "@/components/groups/group-grid";
import { GroupSearch } from "@/components/groups/group-search";
import { GroupsEmptyState } from "@/components/groups/groups-empty-state";
import { initialGroupMembership, initialGroupSeeds, mockContacts, type MockGroupSeed } from "@/lib/mock-groups";
import type { GroupFormValues } from "@/lib/validation/group-schema";
import type { Contact } from "@/types/contact";
import type { Group } from "@/types/group";

function matchesSearch(group: Group, term: string): boolean {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return true;
  return group.name.toLowerCase().includes(normalized);
}

function toGroup(seed: MockGroupSeed, memberIds: string[]): Group {
  return {
    id: seed.id,
    name: seed.name,
    createdAt: seed.createdAt,
    updatedAt: seed.updatedAt,
    contactCount: memberIds.length,
  };
}

export default function GroupsPage() {
  const { showToast } = useToast();

  const [groupSeeds, setGroupSeeds] = useState<MockGroupSeed[]>(initialGroupSeeds);
  const [membership, setMembership] = useState<Record<string, string[]>>(initialGroupMembership);
  const [searchTerm, setSearchTerm] = useState("");
  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; group?: Group } | null>(null);
  const [groupPendingDelete, setGroupPendingDelete] = useState<Group | null>(null);

  const groups = useMemo(
    () => groupSeeds.map((seed) => toGroup(seed, membership[seed.id] ?? [])),
    [groupSeeds, membership]
  );

  const filteredGroups = useMemo(
    () => groups.filter((group) => matchesSearch(group, searchTerm)),
    [groups, searchTerm]
  );

  const membersByGroupId = useMemo(() => {
    const contactsById = new Map(mockContacts.map((contact) => [contact.id, contact]));
    const result: Record<string, Contact[]> = {};
    for (const group of groups) {
      result[group.id] = (membership[group.id] ?? []).flatMap((id) => {
        const contact = contactsById.get(id);
        return contact ? [contact] : [];
      });
    }
    return result;
  }, [groups, membership]);

  const existingNames = useMemo(
    () => new Set(groups.filter((group) => group.id !== formModal?.group?.id).map((group) => group.name.toLowerCase())),
    [groups, formModal]
  );

  const currentMemberIds = formModal?.group ? (membership[formModal.group.id] ?? []) : [];

  const handleFormSubmit = async (values: GroupFormValues) => {
    const now = new Date().toISOString();

    if (formModal?.mode === "edit" && formModal.group) {
      const groupId = formModal.group.id;
      setGroupSeeds((seeds) =>
        seeds.map((seed) => (seed.id === groupId ? { ...seed, name: values.name, updatedAt: now } : seed))
      );
      setMembership((current) => ({ ...current, [groupId]: values.contactIds }));
      showToast("Group updated successfully.");
    } else {
      const newId = crypto.randomUUID();
      setGroupSeeds((seeds) => [...seeds, { id: newId, name: values.name, createdAt: now, updatedAt: now }]);
      setMembership((current) => ({ ...current, [newId]: values.contactIds }));
      showToast("Group created successfully.");
    }
  };

  const handleDeleteConfirm = (group: Group) => {
    setGroupSeeds((seeds) => seeds.filter((seed) => seed.id !== group.id));
    setMembership((current) => {
      const next = { ...current };
      delete next[group.id];
      return next;
    });
    setGroupPendingDelete(null);
    showToast("Group deleted successfully.");
  };

  return (
    <main className="flex min-h-screen flex-col bg-background p-10">
      <div className="mb-8 flex w-full items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] font-bold text-foreground">Groups</h1>
          <p className="text-sm text-foreground-muted">Organize and manage your audience segments</p>
        </div>
        <Button onClick={() => setFormModal({ mode: "create" })}>+ Create Group</Button>
      </div>

      <div className="flex w-full flex-col gap-6 rounded-lg bg-white p-6">
        <div className="flex w-full items-center justify-between pb-3">
          <GroupSearch value={searchTerm} onChange={setSearchTerm} />
        </div>

        {filteredGroups.length > 0 ? (
          <GroupGrid
            groups={filteredGroups}
            membersByGroupId={membersByGroupId}
            onManage={(group) => setFormModal({ mode: "edit", group })}
            onDelete={setGroupPendingDelete}
          />
        ) : (
          <GroupsEmptyState onCreateGroup={() => setFormModal({ mode: "create" })} />
        )}
      </div>

      <GroupFormModal
        open={formModal !== null}
        onOpenChange={(open) => {
          if (!open) setFormModal(null);
        }}
        mode={formModal?.mode ?? "create"}
        group={formModal?.group}
        currentMemberIds={currentMemberIds}
        allContacts={mockContacts}
        existingNames={existingNames}
        onSubmit={handleFormSubmit}
      />

      <DeleteGroupDialog
        group={groupPendingDelete}
        onOpenChange={(open) => {
          if (!open) setGroupPendingDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </main>
  );
}

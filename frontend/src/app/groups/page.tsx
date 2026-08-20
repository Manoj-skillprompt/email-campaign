"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { DeleteGroupDialog } from "@/components/groups/delete-group-dialog";
import { GroupFormModal } from "@/components/groups/group-form-modal";
import { GroupGrid } from "@/components/groups/group-grid";
import { GroupSearch } from "@/components/groups/group-search";
import { GroupsEmptyState } from "@/components/groups/groups-empty-state";
import { apiClient, groupsApiClient } from "@/lib/api-client";
import { toGroupFieldError } from "@/lib/group-form-errors";
import type { GroupFormValues } from "@/lib/validation/group-schema";
import type { Contact } from "@/types/contact";
import type { Group } from "@/types/group";

const GROUPS_QUERY_KEY = ["groups"];
const CONTACTS_QUERY_KEY = ["contacts"];

function matchesSearch(group: Group, term: string): boolean {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return true;
  return group.name.toLowerCase().includes(normalized);
}

export default function GroupsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: groupsResponse, isLoading } = groupsApiClient.getGroups.useQuery(GROUPS_QUERY_KEY, { query: {} });
  const groups = useMemo(() => groupsResponse?.body ?? [], [groupsResponse]);

  const { data: contactsResponse } = apiClient.listContacts.useQuery(CONTACTS_QUERY_KEY, { query: {} });
  const contacts = useMemo(() => contactsResponse?.body ?? [], [contactsResponse]);

  const [searchTerm, setSearchTerm] = useState("");
  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; group?: Group } | null>(null);
  const [groupPendingDelete, setGroupPendingDelete] = useState<Group | null>(null);

  const createMutation = groupsApiClient.createGroup.useMutation();
  const updateMutation = groupsApiClient.updateGroup.useMutation();
  const deleteMutation = groupsApiClient.deleteGroup.useMutation();

  const filteredGroups = useMemo(
    () => groups.filter((group) => matchesSearch(group, searchTerm)),
    [groups, searchTerm]
  );

  const membersByGroupId = useMemo(() => {
    const contactsById = new Map(contacts.map((contact) => [contact.id, contact]));
    const result: Record<string, Contact[]> = {};
    for (const group of groups) {
      result[group.id] = group.contactIds.flatMap((id) => {
        const contact = contactsById.get(id);
        return contact ? [contact] : [];
      });
    }
    return result;
  }, [groups, contacts]);

  const existingNames = useMemo(
    () => new Set(groups.filter((group) => group.id !== formModal?.group?.id).map((group) => group.name.toLowerCase())),
    [groups, formModal]
  );

  const currentMemberIds = formModal?.group ? formModal.group.contactIds : [];

  const invalidateGroups = () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });

  const handleFormSubmit = async (values: GroupFormValues) => {
    try {
      if (formModal?.mode === "edit" && formModal.group) {
        const currentIds = formModal.group.contactIds;
        const addContactIds = values.contactIds.filter((id) => !currentIds.includes(id));
        const removeContactIds = currentIds.filter((id) => !values.contactIds.includes(id));
        await updateMutation.mutateAsync({
          params: { id: formModal.group.id },
          body: { name: values.name, addContactIds, removeContactIds },
        });
        showToast("Group updated successfully.");
      } else {
        await createMutation.mutateAsync({ body: { name: values.name, contactIds: values.contactIds } });
        showToast("Group created successfully.");
      }
      await invalidateGroups();
    } catch (error) {
      throw toGroupFieldError(error);
    }
  };

  const handleDeleteConfirm = async (group: Group) => {
    try {
      await deleteMutation.mutateAsync({ params: { id: group.id } });
      setGroupPendingDelete(null);
      await invalidateGroups();
      showToast("Group deleted successfully.");
    } catch {
      setGroupPendingDelete(null);
      showToast("Could not delete this group. Please try again.", "error");
    }
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

        {isLoading ? (
          <p className="py-16 text-center text-sm text-foreground-muted">Loading groups...</p>
        ) : filteredGroups.length > 0 ? (
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
        allContacts={contacts}
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

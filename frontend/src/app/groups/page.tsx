"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { GroupDeleteDialog } from "@/features/groups/components/group-delete-dialog";
import { GroupEmptyState } from "@/features/groups/components/group-empty-state";
import { GroupFormModal } from "@/features/groups/components/group-form-modal";
import { GroupGrid } from "@/features/groups/components/group-grid";
import { GroupMembershipView } from "@/features/groups/components/group-membership-view";
import { GroupSearchBar } from "@/features/groups/components/group-search-bar";
import type { Group } from "@/features/groups/group.types";
import type { GroupWithMembers } from "@/features/groups/groups.mock-api";
import {
  useAssignContactMutation,
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useGroupsQuery,
  useUnassignContactMutation,
  useUpdateGroupMutation,
} from "@/features/groups/use-groups";

type FormModalState = { mode: "create" } | { mode: "edit"; group: Group } | null;

export default function GroupsPage() {
  const [search, setSearch] = useState("");
  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [groupPendingDelete, setGroupPendingDelete] = useState<Group | null>(null);
  const [managingGroupId, setManagingGroupId] = useState<string | null>(null);

  const { showToast } = useToast();
  const groupsQuery = useGroupsQuery(search);
  const createGroupMutation = useCreateGroupMutation();
  const updateGroupMutation = useUpdateGroupMutation();
  const deleteGroupMutation = useDeleteGroupMutation();
  const assignContactMutation = useAssignContactMutation();
  const unassignContactMutation = useUnassignContactMutation();

  const groups = groupsQuery.data ?? [];
  const managingGroup: GroupWithMembers | null = groups.find((group) => group.id === managingGroupId) ?? null;

  const handleFormSubmit = async (values: { name: string }) => {
    if (formModal?.mode === "edit") {
      await updateGroupMutation.mutateAsync({ id: formModal.group.id, input: values });
      showToast("Group updated successfully.");
    } else {
      await createGroupMutation.mutateAsync(values);
      showToast("Group created successfully.");
    }
    setFormModal(null);
  };

  const handleDeleteConfirm = async (group: Group) => {
    await deleteGroupMutation.mutateAsync(group.id);
    showToast("Group deleted successfully.");
    setGroupPendingDelete(null);
  };

  return (
    <main className="flex flex-col items-start bg-background p-10">
      <div className="flex w-full items-center justify-between bg-background pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] font-bold text-foreground">Groups</h1>
          <p className="text-sm text-foreground-muted">Organize and manage your audience segments</p>
        </div>
        <Button type="button" onClick={() => setFormModal({ mode: "create" })}>
          <img src="/icons/contacts/plus.svg" alt="" className="size-3.5" />
          Create Group
        </Button>
      </div>

      <div className="flex w-full flex-col gap-6 rounded-lg bg-white p-6">
        <div className="flex w-full items-center justify-between pb-3">
          <GroupSearchBar value={search} onChange={setSearch} />
        </div>

        {groups.length > 0 ? (
          <GroupGrid
            groups={groups}
            onEdit={(group) => setFormModal({ mode: "edit", group })}
            onDelete={(group) => setGroupPendingDelete(group)}
            onManage={(group) => setManagingGroupId(group.id)}
          />
        ) : (
          <GroupEmptyState onCreateGroup={() => setFormModal({ mode: "create" })} />
        )}
      </div>

      <GroupFormModal
        open={formModal !== null}
        mode={formModal?.mode ?? "create"}
        group={formModal?.mode === "edit" ? formModal.group : undefined}
        onOpenChange={(open) => {
          if (!open) setFormModal(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <GroupDeleteDialog
        group={groupPendingDelete}
        onOpenChange={(open) => {
          if (!open) setGroupPendingDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      <GroupMembershipView
        group={managingGroup}
        onOpenChange={(open) => {
          if (!open) setManagingGroupId(null);
        }}
        onAssign={async (groupId, contact) => {
          await assignContactMutation.mutateAsync({ groupId, contact });
        }}
        onUnassign={async (groupId, contactId) => {
          await unassignContactMutation.mutateAsync({ groupId, contactId });
        }}
      />
    </main>
  );
}

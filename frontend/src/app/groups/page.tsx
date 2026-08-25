"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useContactsQuery } from "@/features/contacts/use-contacts";
import { GroupCreateModal } from "@/features/groups/components/group-create-modal";
import { GroupDeleteDialog } from "@/features/groups/components/group-delete-dialog";
import { GroupEmptyState } from "@/features/groups/components/group-empty-state";
import { GroupFormModal } from "@/features/groups/components/group-form-modal";
import { GroupGrid } from "@/features/groups/components/group-grid";
import { GroupMembershipView } from "@/features/groups/components/group-membership-view";
import { GroupSearchBar } from "@/features/groups/components/group-search-bar";
import type { Group, GroupMember, GroupWithMembers } from "@/features/groups/group.types";
import {
  useAssignContactMutation,
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useGroupsQuery,
  useUnassignContactMutation,
  useUpdateGroupMutation,
} from "@/features/groups/use-groups";

function isApiError(error: unknown): error is { status: number; body: { message: string } } {
  return typeof error === "object" && error !== null && "status" in error && "body" in error;
}

export default function GroupsPage() {
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupPendingDelete, setGroupPendingDelete] = useState<Group | null>(null);
  const [managingGroupId, setManagingGroupId] = useState<string | null>(null);

  const { showToast } = useToast();
  const groupsQuery = useGroupsQuery(search);
  const contactsQuery = useContactsQuery("");
  const createGroupMutation = useCreateGroupMutation();
  const updateGroupMutation = useUpdateGroupMutation();
  const deleteGroupMutation = useDeleteGroupMutation();
  const assignContactMutation = useAssignContactMutation();
  const unassignContactMutation = useUnassignContactMutation();

  const groups = groupsQuery.data?.body ?? [];
  const contacts = contactsQuery.data?.body ?? [];

  const contactsById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts]);

  const groupsWithMembers: GroupWithMembers[] = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        members: group.contactIds.reduce<GroupMember[]>((members, contactId) => {
          const contact = contactsById.get(contactId);
          if (contact) members.push({ id: contact.id, name: contact.name });
          return members;
        }, []),
      })),
    [groups, contactsById]
  );

  const managingGroup = groupsWithMembers.find((group) => group.id === managingGroupId) ?? null;

  const handleCreateGroup = async ({ name, contactIds }: { name: string; contactIds: string[] }) => {
    const created = await createGroupMutation.mutateAsync({ body: { name } });
    const newGroupId = created.body.id;

    for (const contactId of contactIds) {
      await assignContactMutation.mutateAsync({ params: { id: newGroupId }, body: { contactId } });
    }

    showToast("Group created successfully.");
    setCreateModalOpen(false);
  };

  const handleEditSubmit = async (values: { name: string }) => {
    if (!editingGroup) return;
    await updateGroupMutation.mutateAsync({ params: { id: editingGroup.id }, body: values });
    showToast("Group updated successfully.");
    setEditingGroup(null);
  };

  const handleDeleteConfirm = async (group: Group) => {
    await deleteGroupMutation.mutateAsync({ params: { id: group.id } });
    showToast("Group deleted successfully.");
    setGroupPendingDelete(null);
  };

  const handleAssign = async (groupId: string, contact: GroupMember) => {
    try {
      await assignContactMutation.mutateAsync({ params: { id: groupId }, body: { contactId: contact.id } });
    } catch (error) {
      showToast(isApiError(error) ? error.body.message : "Could not assign contact to group.", "error");
    }
  };

  const handleUnassign = async (groupId: string, contactId: string) => {
    try {
      await unassignContactMutation.mutateAsync({ params: { id: groupId, contactId } });
    } catch (error) {
      showToast(isApiError(error) ? error.body.message : "Could not remove contact from group.", "error");
    }
  };

  return (
    <main className="flex flex-col items-start bg-background p-10">
      <div className="flex w-full items-center justify-between pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] font-bold text-foreground">Groups</h1>
          <p className="text-sm text-foreground-muted">Organize and manage your audience segments</p>
        </div>
        <Button type="button" onClick={() => setCreateModalOpen(true)}>
          + Create Group
        </Button>
      </div>

      <div className="w-full pb-4">
        <GroupSearchBar value={search} onChange={setSearch} />
      </div>

      {groupsWithMembers.length > 0 ? (
        <div className="flex w-full flex-col items-start bg-white py-8">
          <GroupGrid
            groups={groupsWithMembers}
            onEdit={(group) => setEditingGroup(group)}
            onDelete={(group) => setGroupPendingDelete(group)}
            onManage={(group) => setManagingGroupId(group.id)}
          />
        </div>
      ) : (
        <GroupEmptyState onCreateGroup={() => setCreateModalOpen(true)} />
      )}

      <GroupCreateModal open={createModalOpen} onOpenChange={setCreateModalOpen} onCreate={handleCreateGroup} />

      <GroupFormModal
        open={editingGroup !== null}
        mode="edit"
        group={editingGroup ?? undefined}
        onOpenChange={(open) => {
          if (!open) setEditingGroup(null);
        }}
        onSubmit={handleEditSubmit}
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
        onAssign={handleAssign}
        onUnassign={handleUnassign}
      />
    </main>
  );
}

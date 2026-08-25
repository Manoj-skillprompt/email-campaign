import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CreateGroupInput, UpdateGroupInput } from "./group.types";
import {
  assignContactToGroup,
  createGroup,
  deleteGroup,
  listGroups,
  unassignContactFromGroup,
  updateGroup,
} from "./groups.mock-api";
import type { MockContactRef } from "./groups.mock-data";

const groupsQueryKey = (search?: string) => ["groups", { search: search ?? "" }] as const;

export function useGroupsQuery(search: string) {
  return useQuery({
    queryKey: groupsQueryKey(search),
    queryFn: () => listGroups({ search }),
  });
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupInput) => createGroup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useUpdateGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGroupInput }) => updateGroup(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useDeleteGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useAssignContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, contact }: { groupId: string; contact: MockContactRef }) =>
      assignContactToGroup(groupId, contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useUnassignContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, contactId }: { groupId: string; contactId: string }) =>
      unassignContactFromGroup(groupId, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

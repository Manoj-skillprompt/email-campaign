import { useQueryClient } from "@tanstack/react-query";

import { tsrGroups } from "@/lib/api-client";

export function useGroupsQuery(search: string) {
  return tsrGroups.listGroups.useQuery({
    queryKey: ["groups", { search }],
    queryData: { query: { search: search || undefined } },
  });
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  return tsrGroups.createGroup.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useUpdateGroupMutation() {
  const queryClient = useQueryClient();
  return tsrGroups.updateGroup.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useDeleteGroupMutation() {
  const queryClient = useQueryClient();
  return tsrGroups.deleteGroup.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useAssignContactMutation() {
  const queryClient = useQueryClient();
  return tsrGroups.assignContact.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useUnassignContactMutation() {
  const queryClient = useQueryClient();
  return tsrGroups.unassignContact.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

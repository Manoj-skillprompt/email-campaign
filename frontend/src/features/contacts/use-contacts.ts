import { useQueryClient } from "@tanstack/react-query";

import { tsr } from "@/lib/api-client";

export function useContactsQuery(search: string) {
  return tsr.listContacts.useQuery({
    queryKey: ["contacts", { search }],
    queryData: { query: { search: search || undefined } },
  });
}

export function useCreateContactMutation() {
  const queryClient = useQueryClient();
  return tsr.createContact.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateContactMutation() {
  const queryClient = useQueryClient();
  return tsr.updateContact.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteContactMutation() {
  const queryClient = useQueryClient();
  return tsr.deleteContact.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

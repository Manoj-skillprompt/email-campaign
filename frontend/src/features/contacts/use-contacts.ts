import { useQueryClient } from "@tanstack/react-query";

import { tsr } from "@/lib/api-client";

const DEFAULT_PAGE_SIZE = 10;

export function useContactsQuery(search: string) {
  return tsr.listContacts.useQuery({
    queryKey: ["contacts", { search }],
    queryData: { query: { search: search || undefined } },
  });
}

export function usePaginatedContactsQuery(search: string, page: number, pageSize: number = DEFAULT_PAGE_SIZE) {
  return tsr.listContacts.useQuery({
    queryKey: ["contacts", { search, page, pageSize }],
    queryData: { query: { search: search || undefined, page, pageSize } },
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

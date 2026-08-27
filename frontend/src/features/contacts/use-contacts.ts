import { useQueryClient } from "@tanstack/react-query";

import { tsr } from "@/lib/api-client";

const DEFAULT_PAGE_SIZE = 10;

const MAX_PAGE_SIZE = 100;

// groups still needs the full contact list; request the contract's max pageSize and
// unwrap back to a plain array so existing callers don't need to know about pagination.
export function useContactsQuery(search: string) {
  return tsr.listContacts.useQuery({
    queryKey: ["contacts", { search, pageSize: MAX_PAGE_SIZE }],
    queryData: { query: { search: search || undefined, pageSize: MAX_PAGE_SIZE } },
    select: (response) => ({
      ...response,
      body: response.body.data,
    }),
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

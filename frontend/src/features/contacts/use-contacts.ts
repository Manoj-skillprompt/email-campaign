import type { Contact } from "@email-campaign-v2/contracts";
import { useQueryClient } from "@tanstack/react-query";

import { tsr } from "@/lib/api-client";

import type { PaginatedContactsMock } from "./contact.types";

const DEFAULT_PAGE_SIZE = 10;

export function useContactsQuery(search: string) {
  return tsr.listContacts.useQuery({
    queryKey: ["contacts", { search }],
    queryData: { query: { search: search || undefined } },
  });
}

export function paginate(contacts: Contact[], page: number, pageSize: number): PaginatedContactsMock {
  const total = contacts.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  return {
    data: contacts.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  };
}

export function usePaginatedContactsQuery(search: string, page: number, pageSize: number = DEFAULT_PAGE_SIZE) {
  return tsr.listContacts.useQuery({
    queryKey: ["contacts", { search }],
    queryData: { query: { search: search || undefined } },
    select: (response) => ({
      ...response,
      body: paginate(response.body, page, pageSize),
    }),
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

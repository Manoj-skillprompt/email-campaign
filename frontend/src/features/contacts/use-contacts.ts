import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CreateContactInput, UpdateContactInput } from "./contact.types";
import { createContact, deleteContact, listContacts, updateContact } from "./contacts.mock-api";

const contactsQueryKey = (search?: string) => ["contacts", { search: search ?? "" }] as const;

export function useContactsQuery(search: string) {
  return useQuery({
    queryKey: contactsQueryKey(search),
    queryFn: () => listContacts({ search }),
  });
}

export function useCreateContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateContactInput) => createContact(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateContactInput }) => updateContact(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

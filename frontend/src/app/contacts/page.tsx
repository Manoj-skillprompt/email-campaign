"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ContactFormModal } from "@/components/contacts/contact-form-modal";
import { ContactSearch } from "@/components/contacts/contact-search";
import { ContactTable } from "@/components/contacts/contact-table";
import { ContactsEmptyState } from "@/components/contacts/contacts-empty-state";
import { DeleteContactDialog } from "@/components/contacts/delete-contact-dialog";
import { apiClient } from "@/lib/api-client";
import { toContactFieldError } from "@/lib/contact-form-errors";
import type { ContactFormValues } from "@/lib/validation/contact-schema";
import type { Contact } from "@/types/contact";

const CONTACTS_QUERY_KEY = ["contacts"];

function matchesSearch(contact: Contact, term: string): boolean {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return true;
  return (
    contact.name.toLowerCase().includes(normalized) ||
    contact.email.toLowerCase().includes(normalized) ||
    contact.branch.toLowerCase().includes(normalized)
  );
}

export default function ContactsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: contactsResponse, isLoading } = apiClient.listContacts.useQuery(CONTACTS_QUERY_KEY, {
    query: {},
  });
  const contacts = useMemo(() => contactsResponse?.body ?? [], [contactsResponse]);

  const [searchTerm, setSearchTerm] = useState("");
  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; contact?: Contact } | null>(null);
  const [contactPendingDelete, setContactPendingDelete] = useState<Contact | null>(null);

  const createMutation = apiClient.createContact.useMutation();
  const updateMutation = apiClient.updateContact.useMutation();
  const deleteMutation = apiClient.deleteContact.useMutation();

  const filteredContacts = useMemo(
    () => contacts.filter((contact) => matchesSearch(contact, searchTerm)),
    [contacts, searchTerm]
  );

  const existingEmails = useMemo(
    () =>
      new Set(
        contacts
          .filter((contact) => contact.id !== formModal?.contact?.id)
          .map((contact) => contact.email.toLowerCase())
      ),
    [contacts, formModal]
  );

  const invalidateContacts = () => queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY });

  const handleFormSubmit = async (values: ContactFormValues) => {
    try {
      if (formModal?.mode === "edit" && formModal.contact) {
        await updateMutation.mutateAsync({ params: { id: formModal.contact.id }, body: values });
        showToast("Contact updated successfully.");
      } else {
        await createMutation.mutateAsync({ body: values });
        showToast("Contact created successfully.");
      }
      await invalidateContacts();
    } catch (error) {
      throw toContactFieldError(error);
    }
  };

  const handleDeleteConfirm = async (contact: Contact) => {
    try {
      await deleteMutation.mutateAsync({ params: { id: contact.id } });
      setContactPendingDelete(null);
      await invalidateContacts();
      showToast("Contact deleted successfully.");
    } catch {
      setContactPendingDelete(null);
      showToast("Could not delete this contact. Please try again.", "error");
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-background p-10">
      <div className="mb-8 flex w-full items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] font-bold text-foreground">Contacts</h1>
          <p className="text-sm text-foreground-muted">{contacts.length} total contacts found</p>
        </div>
        <Button onClick={() => setFormModal({ mode: "create" })}>
          <img src="/icons/plus.svg" alt="" className="size-3.5" width={14} height={14} />
          Add Contact
        </Button>
      </div>

      <div className="flex w-full flex-col gap-6 rounded-lg bg-white p-6">
        <div className="flex w-full items-center justify-between pb-3">
          <ContactSearch value={searchTerm} onChange={setSearchTerm} />
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-foreground-muted">Loading contacts...</p>
        ) : filteredContacts.length > 0 ? (
          <ContactTable
            contacts={filteredContacts}
            onEdit={(contact) => setFormModal({ mode: "edit", contact })}
            onDelete={setContactPendingDelete}
          />
        ) : (
          <ContactsEmptyState onAddContact={() => setFormModal({ mode: "create" })} />
        )}
      </div>

      <ContactFormModal
        open={formModal !== null}
        onOpenChange={(open) => {
          if (!open) setFormModal(null);
        }}
        mode={formModal?.mode ?? "create"}
        contact={formModal?.contact}
        existingEmails={existingEmails}
        onSubmit={handleFormSubmit}
      />

      <DeleteContactDialog
        contact={contactPendingDelete}
        onOpenChange={(open) => {
          if (!open) setContactPendingDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </main>
  );
}

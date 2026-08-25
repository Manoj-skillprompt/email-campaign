"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ContactDeleteDialog } from "@/features/contacts/components/contact-delete-dialog";
import { ContactEmptyState } from "@/features/contacts/components/contact-empty-state";
import { ContactFormModal } from "@/features/contacts/components/contact-form-modal";
import { ContactSearchBar } from "@/features/contacts/components/contact-search-bar";
import { ContactTable } from "@/features/contacts/components/contact-table";
import type { Contact } from "@/features/contacts/contact.types";
import {
  useContactsQuery,
  useCreateContactMutation,
  useDeleteContactMutation,
  useUpdateContactMutation,
} from "@/features/contacts/use-contacts";

type FormModalState = { mode: "create" } | { mode: "edit"; contact: Contact } | null;

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [contactPendingDelete, setContactPendingDelete] = useState<Contact | null>(null);

  const { showToast } = useToast();
  const contactsQuery = useContactsQuery(search);
  const createContactMutation = useCreateContactMutation();
  const updateContactMutation = useUpdateContactMutation();
  const deleteContactMutation = useDeleteContactMutation();

  const contacts = contactsQuery.data ?? [];

  const handleFormSubmit = async (values: { name: string; email: string; branch: string }) => {
    if (formModal?.mode === "edit") {
      await updateContactMutation.mutateAsync({ id: formModal.contact.id, input: values });
      showToast("Contact updated successfully.");
    } else {
      await createContactMutation.mutateAsync(values);
      showToast("Contact created successfully.");
    }
    setFormModal(null);
  };

  const handleDeleteConfirm = async (contact: Contact) => {
    await deleteContactMutation.mutateAsync(contact.id);
    showToast("Contact deleted successfully.");
    setContactPendingDelete(null);
  };

  return (
    <main className="flex flex-col items-start bg-background p-10">
      <div className="flex w-full items-center justify-between bg-background pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] font-bold text-foreground">Contacts</h1>
          <p className="text-sm text-foreground-muted">{contacts.length} total contacts found</p>
        </div>
        <Button type="button" onClick={() => setFormModal({ mode: "create" })}>
          <img src="/icons/contacts/plus.svg" alt="" className="size-3.5" />
          Add Contact
        </Button>
      </div>

      <div className="flex w-full flex-col gap-6 rounded-lg bg-white p-6">
        <div className="flex w-full items-center justify-between pb-3">
          <ContactSearchBar value={search} onChange={setSearch} />
        </div>

        {contacts.length > 0 ? (
          <ContactTable
            contacts={contacts}
            onEdit={(contact) => setFormModal({ mode: "edit", contact })}
            onDelete={(contact) => setContactPendingDelete(contact)}
          />
        ) : (
          <ContactEmptyState onAddContact={() => setFormModal({ mode: "create" })} />
        )}
      </div>

      <ContactFormModal
        open={formModal !== null}
        mode={formModal?.mode ?? "create"}
        contact={formModal?.mode === "edit" ? formModal.contact : undefined}
        onOpenChange={(open) => {
          if (!open) setFormModal(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <ContactDeleteDialog
        contact={contactPendingDelete}
        onOpenChange={(open) => {
          if (!open) setContactPendingDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </main>
  );
}

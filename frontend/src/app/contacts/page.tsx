"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ContactFormModal } from "@/components/contacts/contact-form-modal";
import { ContactSearch } from "@/components/contacts/contact-search";
import { ContactTable } from "@/components/contacts/contact-table";
import { ContactsEmptyState } from "@/components/contacts/contacts-empty-state";
import { DeleteContactDialog } from "@/components/contacts/delete-contact-dialog";
import { INITIAL_MOCK_CONTACTS } from "@/lib/mock-contacts";
import type { ContactFormValues } from "@/lib/validation/contact-schema";
import type { Contact } from "@/types/contact";

function matchesSearch(contact: Contact, term: string): boolean {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return true;
  return (
    contact.name.toLowerCase().includes(normalized) ||
    contact.email.toLowerCase().includes(normalized) ||
    contact.branch.toLowerCase().includes(normalized)
  );
}

function generateClientId(): string {
  return `LOCAL-${crypto.randomUUID().slice(0, 6)}`;
}

export default function ContactsPage() {
  const { showToast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_MOCK_CONTACTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; contact?: Contact } | null>(null);
  const [contactPendingDelete, setContactPendingDelete] = useState<Contact | null>(null);

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

  const handleFormSubmit = (values: ContactFormValues) => {
    const now = new Date().toISOString();

    if (formModal?.mode === "edit" && formModal.contact) {
      const editedId = formModal.contact.id;
      setContacts((current) =>
        current.map((contact) => (contact.id === editedId ? { ...contact, ...values, updatedAt: now } : contact))
      );
      showToast("Contact updated successfully.");
      return;
    }

    const newContact: Contact = {
      id: crypto.randomUUID(),
      clientId: generateClientId(),
      ...values,
      createdAt: now,
      updatedAt: now,
    };
    setContacts((current) => [newContact, ...current]);
    showToast("Contact created successfully.");
  };

  const handleDeleteConfirm = (contact: Contact) => {
    setContacts((current) => current.filter((entry) => entry.id !== contact.id));
    setContactPendingDelete(null);
    showToast("Contact deleted successfully.");
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

        {filteredContacts.length > 0 ? (
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

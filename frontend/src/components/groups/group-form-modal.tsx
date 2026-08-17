"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildGroupFormSchema, type GroupFormValues } from "@/lib/validation/group-schema";
import type { Contact } from "@/types/contact";
import type { Group } from "@/types/group";

interface GroupFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  group?: Group;
  currentMemberIds: string[];
  allContacts: Contact[];
  existingNames: Set<string>;
  onSubmit: (values: GroupFormValues) => Promise<void>;
}

function matchesContactSearch(contact: Contact, term: string): boolean {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return true;
  return contact.name.toLowerCase().includes(normalized) || contact.email.toLowerCase().includes(normalized);
}

export function GroupFormModal({
  open,
  onOpenChange,
  mode,
  group,
  currentMemberIds,
  allContacts,
  existingNames,
  onSubmit,
}: GroupFormModalProps) {
  const [contactSearch, setContactSearch] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(buildGroupFormSchema(existingNames, group?.name)),
    defaultValues: {
      name: group?.name ?? "",
      contactIds: currentMemberIds,
    },
  });

  useEffect(() => {
    if (open) {
      setContactSearch("");
      reset({
        name: group?.name ?? "",
        contactIds: currentMemberIds,
      });
    }
  }, [open, group, currentMemberIds, reset]);

  const selectedContactIds = watch("contactIds");

  const toggleContact = (contactId: string) => {
    if (selectedContactIds.includes(contactId)) {
      setValue(
        "contactIds",
        selectedContactIds.filter((id) => id !== contactId)
      );
    } else {
      setValue("contactIds", [...selectedContactIds, contactId]);
    }
  };

  const visibleContacts = allContacts.filter((contact) => matchesContactSearch(contact, contactSearch));

  const handleValidSubmit = async (values: GroupFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Group" : "Edit Group"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleValidSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="e.g. Sydney Visa Pending Clients"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Contacts</Label>
              <span className="text-xs text-foreground-muted">{selectedContactIds.length} selected</span>
            </div>

            <div className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
              <img src="/icons/search.svg" alt="" className="size-3.5" width={14} height={14} />
              <input
                type="text"
                value={contactSearch}
                onChange={(event) => setContactSearch(event.target.value)}
                placeholder="Search contacts..."
                aria-label="Search contacts to add"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none"
              />
            </div>

            <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto rounded-md border border-border p-2">
              {visibleContacts.length === 0 ? (
                <p className="py-4 text-center text-sm text-foreground-muted">No contacts match your search.</p>
              ) : (
                visibleContacts.map((contact) => (
                  <label
                    key={contact.id}
                    className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-background"
                  >
                    <input
                      type="checkbox"
                      checked={selectedContactIds.includes(contact.id)}
                      onChange={() => toggleContact(contact.id)}
                      className="size-4 accent-primary"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{contact.name}</span>
                      <span className="text-xs text-foreground-muted">{contact.email}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Save Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

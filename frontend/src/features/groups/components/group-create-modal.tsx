"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createGroupSchema, type Contact, type CreateGroupInput } from "@email-campaign-v2/contracts";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useContactsQuery } from "@/features/contacts/use-contacts";

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function isConflictError(error: unknown): error is { status: 409; body: { message: string } } {
  return typeof error === "object" && error !== null && "status" in error && error.status === 409;
}

function StackedBoxIcon() {
  return (
    <div className="relative flex size-9 shrink-0 items-center justify-center rounded-md bg-[#dbeafe]">
      <div className="absolute left-2 top-2.5 h-2.5 w-3.5 rounded-sm border-[1.4px] border-primary" />
      <div className="absolute left-3.5 top-4 h-2.5 w-3.5 rounded-sm border-[1.4px] border-primary bg-white" />
    </div>
  );
}

interface GroupCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: { name: string; contactIds: string[] }) => Promise<void>;
}

type Step = "basics" | "manual-selection";

export function GroupCreateModal({ open, onOpenChange, onCreate }: GroupCreateModalProps) {
  const [step, setStep] = useState<Step>("basics");
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contactSearch, setContactSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: "" },
  });

  const allContactsQuery = useContactsQuery("");
  const availableContactsQuery = useContactsQuery(contactSearch);
  const allContacts = allContactsQuery.data?.body ?? [];
  const availableContacts = availableContactsQuery.data?.body ?? [];
  const selectedContacts = allContacts.filter((contact) => selectedIds.has(contact.id));

  useEffect(() => {
    if (open) {
      setStep("basics");
      setName("");
      setSelectedIds(new Set());
      setContactSearch("");
      reset({ name: "" });
    }
  }, [open, reset]);

  const close = () => onOpenChange(false);

  const continueToManualSelection = handleSubmit((values) => {
    setName(values.name);
    setStep("manual-selection");
  });

  const toggleContact = (contact: Contact) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(contact.id)) {
        next.delete(contact.id);
      } else {
        next.add(contact.id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onCreate({ name, contactIds: Array.from(selectedIds) });
    } catch (error) {
      if (isConflictError(error)) {
        setStep("basics");
        reset({ name });
        setError("name", { message: error.body.message });
        return;
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={step === "basics" ? "w-[480px] max-w-none gap-0 p-0" : "w-[920px] max-w-none gap-0 p-0"}
      >
        <div className="flex w-full items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <StackedBoxIcon />
            <div className="flex flex-col gap-0.5">
              <p className="text-[16px] font-bold text-foreground">
                {step === "basics" ? "Create Group" : `Setup "${name}"`}
              </p>
              <p className="text-[12px] text-foreground-muted">
                {step === "basics" ? "Step 1 of 2: Basics" : "Step 2 of 2: Manual Selection"}
              </p>
            </div>
          </div>
          <button type="button" onClick={close} aria-label="Close">
            <img src="/icons/groups/close.svg" alt="" className="size-5" />
          </button>
        </div>

        {step === "basics" ? (
          <form onSubmit={continueToManualSelection} noValidate className="flex w-full flex-col">
            <div className="flex w-full flex-col gap-6 p-8">
              <div className="flex flex-col gap-2">
                <Label htmlFor="wizard-group-name" className="text-sm font-semibold text-foreground">
                  Group Name
                </Label>
                <Input
                  id="wizard-group-name"
                  placeholder="e.g. Sydney Visa Pending Clients"
                  aria-invalid={Boolean(errors.name)}
                  {...register("name")}
                />
                {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-foreground">Assignment Type</p>
                <div className="flex w-full gap-4">
                  <div className="flex flex-1 flex-col gap-2 rounded-md border-[1.5px] border-primary bg-[#eff6ff] p-4">
                    <img src="/icons/groups/option-manual.svg" alt="" className="size-5" />
                    <p className="text-sm font-bold text-foreground">Add Manually</p>
                    <p className="text-xs text-foreground-muted">Select specific contacts to add</p>
                  </div>
                  <div
                    aria-disabled="true"
                    title="Dynamic filtering is not available yet"
                    className="flex flex-1 cursor-not-allowed flex-col gap-2 rounded-md border border-border bg-white p-4 opacity-70"
                  >
                    <img src="/icons/groups/option-automatic.svg" alt="" className="size-5" />
                    <p className="text-sm font-bold text-foreground">Add Automatically</p>
                    <p className="text-xs text-foreground-muted">Define dynamic filtering conditions</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full p-8 pt-0">
              <Button type="submit" className="w-full justify-center py-3">
                Configure Group →
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex w-full items-start justify-between gap-8 p-8">
              <div className="flex w-[400px] flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex w-80 items-center gap-2 rounded-md border border-border bg-[#f9fafb] px-4 py-2.5">
                    <img src="/icons/groups/search.svg" alt="" className="size-4 shrink-0" />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(event) => setContactSearch(event.target.value)}
                      placeholder="Search contacts..."
                      aria-label="Search available contacts"
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none"
                    />
                  </div>
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border">
                    <img src="/icons/groups/filter.svg" alt="" className="size-4" />
                  </div>
                </div>

                <p className="text-sm font-semibold text-foreground">Available Contacts ({availableContacts.length})</p>

                <div className="flex max-h-[420px] w-full flex-col gap-2 overflow-y-auto">
                  {availableContacts.map((contact) => {
                    const selected = selectedIds.has(contact.id);
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => toggleContact(contact)}
                        className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2.5 text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {initialOf(contact.name)}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-semibold text-foreground">{contact.name}</span>
                            <span className="text-[11px] text-foreground-muted">{contact.email}</span>
                          </div>
                          <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-medium text-foreground-muted">
                            CRM
                          </span>
                          <span className="text-[11px] text-foreground-muted">{contact.branch}</span>
                        </div>
                        {selected ? (
                          <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-primary">
                            <svg viewBox="0 0 12 12" className="size-2.5" fill="none">
                              <path
                                d="M2 6L5 9L10 3"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ) : (
                          <img src="/icons/groups/checkbox-circle.svg" alt="" className="size-[18px] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                  {availableContacts.length === 0 ? (
                    <p className="py-6 text-center text-sm text-foreground-muted">No contacts found.</p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <p className="text-sm font-semibold text-foreground">
                  Group Assigned Contacts ({selectedContacts.length})
                </p>
                {selectedContacts.length > 0 ? (
                  <div className="flex max-h-[420px] w-full flex-col gap-2 overflow-y-auto">
                    {selectedContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                      >
                        <span className="text-[13px] font-semibold text-foreground">{contact.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleContact(contact)}
                          className="text-xs font-medium text-foreground-muted hover:text-foreground"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[420px] w-full flex-col items-center justify-center gap-3 rounded-xl border-[1.5px] border-dashed border-[#d1d5db] bg-background text-center">
                    <img src="/icons/groups/empty-user.svg" alt="" className="size-12" />
                    <p className="text-sm font-semibold text-foreground-muted">Group is currently empty</p>
                    <p className="text-xs text-foreground-subtle">Drag and drop contacts here...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full items-center justify-between p-8">
              <button
                type="button"
                onClick={() => setStep("basics")}
                className="text-sm font-medium text-foreground-muted hover:text-foreground"
              >
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="border-[#d1d5db] px-5 py-2.5 text-[#374151]"
                  onClick={close}
                >
                  Cancel
                </Button>
                <Button type="button" className="px-5 py-2.5" onClick={handleSave} disabled={isSaving}>
                  Save Group
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

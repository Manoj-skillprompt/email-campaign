"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContactFieldError } from "@/lib/contact-form-errors";
import { buildContactFormSchema, type ContactFormValues } from "@/lib/validation/contact-schema";
import type { Contact } from "@/types/contact";

interface ContactFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  contact?: Contact;
  existingEmails: Set<string>;
  onSubmit: (values: ContactFormValues) => Promise<void>;
}

export function ContactFormModal({
  open,
  onOpenChange,
  mode,
  contact,
  existingEmails,
  onSubmit,
}: ContactFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(buildContactFormSchema(existingEmails, contact?.email)),
    defaultValues: {
      name: contact?.name ?? "",
      email: contact?.email ?? "",
      branch: contact?.branch ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: contact?.name ?? "",
        email: contact?.email ?? "",
        branch: contact?.branch ?? "",
      });
    }
  }, [open, contact, reset]);

  const handleValidSubmit = async (values: ContactFormValues) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ContactFieldError) {
        setError(error.field, { type: "server", message: error.message });
        return;
      }
      throw error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Contact" : "Edit Contact"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleValidSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-name">Name</Label>
            <Input id="contact-name" aria-invalid={!!errors.name} {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" type="email" aria-invalid={!!errors.email} {...register("email")} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-branch">Branch</Label>
            <Input id="contact-branch" aria-invalid={!!errors.branch} {...register("branch")} />
            {errors.branch && <p className="text-xs text-red-600">{errors.branch.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

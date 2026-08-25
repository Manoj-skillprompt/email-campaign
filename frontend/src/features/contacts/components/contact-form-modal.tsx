"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createContactSchema, updateContactSchema, type CreateContactInput } from "@email-campaign-v2/contracts";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Contact } from "../contact.types";

type ContactFormValues = CreateContactInput;

function isConflictError(error: unknown): error is { status: 409; body: { message: string } } {
  return typeof error === "object" && error !== null && "status" in error && error.status === 409;
}

interface ContactFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  contact?: Contact;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ContactFormValues) => Promise<void>;
}

const emptyValues: ContactFormValues = { name: "", email: "", branch: "" };

export function ContactFormModal({ open, mode, contact, onOpenChange, onSubmit }: ContactFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(mode === "create" ? createContactSchema : updateContactSchema) as Resolver<ContactFormValues>,
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(contact ? { name: contact.name, email: contact.email, branch: contact.branch } : emptyValues);
    }
  }, [open, contact, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      if (isConflictError(error)) {
        setError("email", { message: error.body.message });
        return;
      }
      throw error;
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Contact" : "Edit Contact"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-name">Name</Label>
            <Input id="contact-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
            {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" type="email" aria-invalid={Boolean(errors.email)} {...register("email")} />
            {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-branch">Branch</Label>
            <Input id="contact-branch" aria-invalid={Boolean(errors.branch)} {...register("branch")} />
            {errors.branch ? <p className="text-sm text-red-600">{errors.branch.message}</p> : null}
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

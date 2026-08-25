"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import type { Contact } from "../contact.types";

interface ContactDeleteDialogProps {
  contact: Contact | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (contact: Contact) => Promise<void>;
}

export function ContactDeleteDialog({ contact, onOpenChange, onConfirm }: ContactDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!contact) return;
    setIsDeleting(true);
    try {
      await onConfirm(contact);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={contact !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Contact</DialogTitle>
          <DialogDescription>
            This will permanently remove {contact?.name} from your contacts. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

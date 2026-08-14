"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Contact } from "@/types/contact";

interface DeleteContactDialogProps {
  contact: Contact | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (contact: Contact) => void;
}

export function DeleteContactDialog({ contact, onOpenChange, onConfirm }: DeleteContactDialogProps) {
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
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (contact) onConfirm(contact);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

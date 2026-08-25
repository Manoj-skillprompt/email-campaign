"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Group } from "../group.types";

interface GroupDeleteDialogProps {
  group: Group | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (group: Group) => Promise<void>;
}

export function GroupDeleteDialog({ group, onOpenChange, onConfirm }: GroupDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!group) return;
    setIsDeleting(true);
    try {
      await onConfirm(group);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={group !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Group</DialogTitle>
          <DialogDescription>
            This will permanently remove {group?.name} and unassign its member contacts. Contacts themselves will not be
            deleted. This action cannot be undone.
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

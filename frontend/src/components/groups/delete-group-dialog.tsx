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
import type { Group } from "@/types/group";

interface DeleteGroupDialogProps {
  group: Group | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (group: Group) => void;
}

export function DeleteGroupDialog({ group, onOpenChange, onConfirm }: DeleteGroupDialogProps) {
  return (
    <Dialog open={group !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Group</DialogTitle>
          <DialogDescription>
            This will permanently remove the group &quot;{group?.name}&quot;. Member contacts will not be affected and
            remain unchanged. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (group) onConfirm(group);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

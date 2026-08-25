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

import type { Campaign } from "../campaign.types";

interface CampaignDeleteDialogProps {
  campaign: Campaign | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (campaign: Campaign) => Promise<void>;
}

export function CampaignDeleteDialog({ campaign, onOpenChange, onConfirm }: CampaignDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!campaign) return;
    setIsDeleting(true);
    try {
      await onConfirm(campaign);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={campaign !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Campaign</DialogTitle>
          <DialogDescription>
            This will permanently remove {campaign?.name}. This action cannot be undone.
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

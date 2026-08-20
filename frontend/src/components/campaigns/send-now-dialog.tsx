"use client";

import type { Group } from "@email-campaign-v2/contracts";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveRecipientCount } from "@/lib/campaign-recipients";

interface SendNowDialogProps {
  open: boolean;
  campaignName: string;
  targetGroupIds: string[];
  targetGroups: Group[];
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function SendNowDialog({
  open,
  campaignName,
  targetGroupIds,
  targetGroups,
  onOpenChange,
  onConfirm,
}: SendNowDialogProps) {
  const recipientCount = resolveRecipientCount(targetGroupIds, targetGroups);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Campaign Now</DialogTitle>
          <DialogDescription>
            &quot;{campaignName}&quot; will be sent to{" "}
            <span className="font-semibold text-foreground">
              {recipientCount} {recipientCount === 1 ? "recipient" : "recipients"}
            </span>
            . This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={recipientCount === 0}>
            Send Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

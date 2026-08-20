"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ScheduleCampaignDialogProps {
  open: boolean;
  campaignName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (scheduledAt: string) => void;
}

export function ScheduleCampaignDialog({ open, campaignName, onOpenChange, onConfirm }: ScheduleCampaignDialogProps) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setScheduledAt("");
      setError(null);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!scheduledAt) {
      setError("Select a date and time");
      return;
    }
    if (new Date(scheduledAt).getTime() <= Date.now()) {
      setError("Scheduled time must be in the future");
      return;
    }
    onConfirm(new Date(scheduledAt).toISOString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Campaign</DialogTitle>
          <DialogDescription>Choose when &quot;{campaignName}&quot; should start sending.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="scheduled-at">Date & time</Label>
          <input
            id="scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => {
              setScheduledAt(event.target.value);
              setError(null);
            }}
            className="w-full rounded-md border border-border bg-white px-4 py-[10px] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Confirm Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

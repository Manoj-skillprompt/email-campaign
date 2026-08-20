"use client";

import type { Group } from "@email-campaign-v2/contracts";

import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Campaign } from "@/types/campaign";

interface CampaignDetailViewProps {
  campaign: Campaign | null;
  targetGroups: Group[];
  onOpenChange: (open: boolean) => void;
}

function formatTimestamp(isoDate: string | null): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function CampaignDetailView({ campaign, targetGroups, onOpenChange }: CampaignDetailViewProps) {
  const namesById = new Map(targetGroups.map((group) => [group.id, group.name]));
  const groupNames = campaign?.targetGroupIds.map((id) => namesById.get(id) ?? "Unknown group") ?? [];

  return (
    <Dialog open={campaign !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{campaign?.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {campaign && <CampaignStatusBadge status={campaign.status} />}
            <span className="text-sm text-foreground-muted">Subject: {campaign?.subject}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-foreground-subtle">SENDER</span>
              <span className="text-foreground">{campaign?.sender}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-foreground-subtle">TARGET GROUPS</span>
              <span className="text-foreground">{groupNames.join(", ")}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-foreground-subtle">SCHEDULED AT</span>
              <span className="text-foreground">{formatTimestamp(campaign?.scheduledAt ?? null)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-foreground-subtle">SENT AT</span>
              <span className="text-foreground">{formatTimestamp(campaign?.sentAt ?? null)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-foreground-subtle">BODY PREVIEW</span>
            <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-4 text-sm text-foreground">
              {campaign?.body}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import type { Group } from "@email-campaign-v2/contracts";

import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import type { Campaign } from "@/types/campaign";

interface CampaignTableProps {
  campaigns: Campaign[];
  targetGroups: Group[];
  onOpen: (campaign: Campaign) => void;
  onDuplicate: (campaign: Campaign) => void;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function resolveAudienceLabel(campaign: Campaign, targetGroups: Group[]): string {
  const namesById = new Map(targetGroups.map((group) => [group.id, group.name]));
  const names = campaign.targetGroupIds.map((id) => namesById.get(id) ?? "Unknown group");
  return names.join(", ");
}

interface CampaignRowActionsProps {
  campaign: Campaign;
  onDuplicate: (campaign: Campaign) => void;
}

function CampaignRowActions({ campaign, onDuplicate }: CampaignRowActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div ref={menuRef} className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        aria-label={`More options for ${campaign.name}`}
        onClick={() => setMenuOpen((open) => !open)}
        className="opacity-70 hover:opacity-100"
      >
        <img src="/icons/more.svg" alt="" className="size-4" width={16} height={16} />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-6 z-10 w-40 rounded-md border border-border bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onDuplicate(campaign);
            }}
            className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-background"
          >
            Duplicate
          </button>
        </div>
      )}
    </div>
  );
}

export function CampaignTable({ campaigns, targetGroups, onOpen, onDuplicate }: CampaignTableProps) {
  return (
    <table className="w-full border-collapse text-left" data-testid="campaign-table">
      <thead>
        <tr className="border-b border-border">
          <th className="w-[280px] px-4 py-3 text-xs font-bold text-foreground-muted">CAMPAIGN</th>
          <th className="w-[260px] px-4 py-3 text-xs font-bold text-foreground-muted">TARGET GROUPS</th>
          <th className="w-[140px] px-4 py-3 text-xs font-bold text-foreground-muted">STATUS</th>
          <th className="w-[120px] px-4 py-3 text-xs font-bold text-foreground-muted">DATE</th>
          <th className="w-[60px] px-4 py-3" />
        </tr>
      </thead>
      <tbody>
        {campaigns.map((campaign) => (
          <tr
            key={campaign.id}
            onClick={() => onOpen(campaign)}
            className="cursor-pointer border-b border-border hover:bg-background"
          >
            <td className="px-4 py-4 text-sm font-semibold text-foreground">{campaign.name}</td>
            <td className="px-4 py-4 text-sm text-foreground-muted">{resolveAudienceLabel(campaign, targetGroups)}</td>
            <td className="px-4 py-4">
              <CampaignStatusBadge status={campaign.status} />
            </td>
            <td className="px-4 py-4 text-sm text-foreground-muted">{formatDate(campaign.updatedAt)}</td>
            <td className="px-4 py-4">
              <CampaignRowActions campaign={campaign} onDuplicate={onDuplicate} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

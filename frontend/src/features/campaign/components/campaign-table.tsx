"use client";

import { useState } from "react";

import type { CampaignWithAudience } from "../campaign.types";

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function rowDate(campaign: CampaignWithAudience): string {
  const iso =
    campaign.status === "SENT"
      ? campaign.sentAt
      : campaign.status === "SCHEDULED"
        ? campaign.scheduledAt
        : campaign.createdAt;
  return dateFormatter.format(new Date(iso ?? campaign.createdAt));
}

function StatusBadge({ status }: { status: CampaignWithAudience["status"] }) {
  if (status === "SCHEDULED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f7ff] px-2 py-1 text-[11px] font-bold text-primary">
        <img src="/icons/campaign/badge-scheduled.svg" alt="" className="size-2.5" />
        SCHEDULED
      </span>
    );
  }
  if (status === "SENT") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f7ff] px-2 py-1 text-[11px] font-bold text-primary">
        <img src="/icons/campaign/badge-sent.svg" alt="" className="size-2.5" />
        SENT
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f4f6] px-2 py-1 text-[11px] font-bold text-foreground-muted">
      <img src="/icons/campaign/tab-drafts.svg" alt="" className="size-2.5" />
      DRAFT
    </span>
  );
}

interface CampaignTableProps {
  campaigns: CampaignWithAudience[];
  onOpen: (campaign: CampaignWithAudience) => void;
  onDelete: (campaign: CampaignWithAudience) => void;
}

export function CampaignTable({ campaigns, onOpen, onDelete }: CampaignTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-border">
          <th className="w-8 px-4 py-3" aria-hidden="true" />
          <th className="w-[260px] px-4 py-3 text-xs font-bold uppercase text-foreground-muted">Campaign</th>
          <th className="w-[110px] px-4 py-3 text-xs font-bold uppercase text-foreground-muted">Type</th>
          <th className="w-[180px] px-4 py-3 text-xs font-bold uppercase text-foreground-muted">Audience</th>
          <th className="w-[140px] px-4 py-3 text-xs font-bold uppercase text-foreground-muted">Status</th>
          <th className="w-[70px] px-4 py-3 text-xs font-bold uppercase text-foreground-muted">Sent</th>
          <th className="w-[90px] px-4 py-3 text-xs font-bold uppercase text-foreground-muted">Open Rate</th>
          <th className="w-[90px] px-4 py-3 text-xs font-bold uppercase text-foreground-muted">Click Rate</th>
          <th className="w-[110px] px-4 py-3 text-xs font-bold uppercase text-foreground-muted">Date</th>
          <th className="w-[60px] px-4 py-3">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {campaigns.map((campaign) => (
          <tr key={campaign.id} className="border-b border-border">
            <td className="px-4 py-4">
              <input
                type="checkbox"
                aria-label={`Select ${campaign.name}`}
                checked={selectedIds.has(campaign.id)}
                onChange={() => toggleSelected(campaign.id)}
                onClick={(event) => event.stopPropagation()}
                className="size-4 rounded border-[#d1d5db]"
              />
            </td>
            <td
              className="cursor-pointer px-4 py-4 text-sm font-semibold text-foreground"
              onClick={() => onOpen(campaign)}
            >
              {campaign.name}
            </td>
            <td className="px-4 py-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ede9fe] px-2 py-1 text-[11px] font-bold text-[#7c3aed]">
                <img src="/icons/campaign/badge-email.svg" alt="" className="size-2.5" />
                EMAIL
              </span>
            </td>
            <td className="px-4 py-4 text-sm text-foreground-muted">{campaign.audienceLabel}</td>
            <td className="px-4 py-4">
              <StatusBadge status={campaign.status} />
            </td>
            <td className="px-4 py-4 text-sm text-foreground-muted">
              {campaign.status === "SENT" ? campaign.sentCount : "—"}
            </td>
            <td className="px-4 py-4 text-sm text-foreground-muted">
              {campaign.status === "SENT" ? `${campaign.openRate.toFixed(1)}%` : "—"}
            </td>
            <td className="px-4 py-4 text-sm text-foreground-muted">
              {campaign.status === "SENT" ? `${campaign.clickRate.toFixed(1)}%` : "—"}
            </td>
            <td className="px-4 py-4 text-sm text-foreground-muted">{rowDate(campaign)}</td>
            <td className="px-4 py-4">
              <button
                type="button"
                aria-label={`Delete ${campaign.name}`}
                onClick={() => onDelete(campaign)}
                className="rounded p-0.5 hover:opacity-70"
              >
                <img src="/icons/campaign/trash.svg" alt="" className="size-3.5" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

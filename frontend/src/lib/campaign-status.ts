import type { CampaignStatus } from "@/types/campaign";

export type CampaignStatusTab = "All" | "Drafts" | "Scheduled" | "Sent";

export const CAMPAIGN_STATUS_TABS: CampaignStatusTab[] = ["All", "Drafts", "Scheduled", "Sent"];

const TAB_STATUS: Record<Exclude<CampaignStatusTab, "All">, CampaignStatus> = {
  Drafts: "Draft",
  Scheduled: "Scheduled",
  Sent: "Sent",
};

export function matchesStatusTab(status: CampaignStatus, tab: CampaignStatusTab): boolean {
  if (tab === "All") return true;
  return status === TAB_STATUS[tab];
}

interface StatusBadgeStyle {
  label: string;
  className: string;
  iconSrc?: string;
}

export const CAMPAIGN_STATUS_BADGES: Record<CampaignStatus, StatusBadgeStyle> = {
  Draft: { label: "DRAFT", className: "bg-[#f3f4f6] text-[#6b7280]" },
  Scheduled: { label: "SCHEDULED", className: "bg-[#e6f7ff] text-[#007bff]", iconSrc: "/icons/status-scheduled.svg" },
  Sending: { label: "SENDING", className: "bg-[#fef3c7] text-[#b45309]" },
  Sent: { label: "SENT", className: "bg-[#e6f7ff] text-[#007bff]", iconSrc: "/icons/status-sent.svg" },
  Failed: { label: "FAILED", className: "bg-[#fee2e2] text-[#dc2626]" },
  Cancelled: { label: "CANCELLED", className: "bg-[#f3f4f6] text-[#374151]" },
};

export function isEditable(status: CampaignStatus): boolean {
  return status === "Draft";
}

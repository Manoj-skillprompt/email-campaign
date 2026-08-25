import type { CampaignStatus } from "../campaign.types";

export type CampaignTabValue = CampaignStatus | "ALL";

const TABS: { value: CampaignTabValue; label: string; icon?: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Drafts", icon: "/icons/campaign/tab-drafts.svg" },
  { value: "SCHEDULED", label: "Scheduled", icon: "/icons/campaign/tab-scheduled.svg" },
  { value: "SENT", label: "Sent", icon: "/icons/campaign/tab-sent.svg" },
];

interface CampaignTabsProps {
  value: CampaignTabValue;
  onChange: (value: CampaignTabValue) => void;
}

export function CampaignTabs({ value, onChange }: CampaignTabsProps) {
  return (
    <div className="flex items-center gap-3">
      {TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={
              active
                ? "flex items-center gap-1.5 rounded-md bg-[#e6f7ff] px-3.5 py-2 text-sm font-medium text-primary"
                : "flex items-center gap-1.5 rounded-md border border-[#d1d5db] px-3.5 py-2 text-sm font-medium text-foreground-muted"
            }
          >
            {tab.value === "ALL" ? (
              <span className="flex size-3.5 flex-col justify-between py-px">
                <span className="h-[2px] rounded-full bg-primary" />
                <span className="h-[2px] rounded-full bg-primary" />
                <span className="h-[2px] rounded-full bg-primary" />
              </span>
            ) : (
              <img src={tab.icon} alt="" className="size-3.5" />
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

import { CAMPAIGN_STATUS_TABS, type CampaignStatusTab } from "@/lib/campaign-status";
import { cn } from "@/lib/utils";

interface CampaignStatusTabsProps {
  value: CampaignStatusTab;
  onChange: (tab: CampaignStatusTab) => void;
}

const TAB_ICONS: Record<Exclude<CampaignStatusTab, "All">, string> = {
  Drafts: "/icons/campaign-tab-drafts.svg",
  Scheduled: "/icons/campaign-tab-scheduled.svg",
  Sent: "/icons/campaign-tab-sent.svg",
};

function TabIcon({ tab, active }: { tab: CampaignStatusTab; active: boolean }) {
  if (tab === "All") {
    return (
      <div className="relative size-3.5 shrink-0">
        <span className="absolute left-0 top-0.5 h-[2px] w-full rounded-sm bg-primary" />
        <span className="absolute left-0 top-[6px] h-[2px] w-full rounded-sm bg-primary" />
        <span className="absolute left-0 top-[10px] h-[2px] w-full rounded-sm bg-primary" />
      </div>
    );
  }

  return (
    <img
      src={TAB_ICONS[tab]}
      alt=""
      className={cn("size-3.5 shrink-0", active ? "" : "opacity-70")}
      width={14}
      height={14}
    />
  );
}

export function CampaignStatusTabs({ value, onChange }: CampaignStatusTabsProps) {
  return (
    <div className="flex items-center gap-3">
      {CAMPAIGN_STATUS_TABS.map((tab) => {
        const isActive = tab === value;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            aria-pressed={isActive}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium",
              isActive ? "bg-[#e6f7ff] text-primary" : "border border-border text-foreground-muted"
            )}
          >
            <TabIcon tab={tab} active={isActive} />
            {tab}
          </button>
        );
      })}
    </div>
  );
}

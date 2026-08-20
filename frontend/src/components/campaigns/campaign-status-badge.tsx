import { CAMPAIGN_STATUS_BADGES } from "@/lib/campaign-status";
import type { CampaignStatus } from "@/types/campaign";

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
}

export function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  const badge = CAMPAIGN_STATUS_BADGES[status];

  return (
    <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${badge.className}`}>
      {badge.iconSrc && <img src={badge.iconSrc} alt="" className="size-[11px]" width={11} height={11} />}
      {badge.label}
    </div>
  );
}

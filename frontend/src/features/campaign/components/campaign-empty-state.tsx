import { Button } from "@/components/ui/button";

interface CampaignEmptyStateProps {
  onCreateCampaign: () => void;
}

export function CampaignEmptyState({ onCreateCampaign }: CampaignEmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4 py-16 text-center">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">No campaigns found</p>
        <p className="text-sm text-foreground-muted">Try adjusting your search or create a new campaign.</p>
      </div>
      <Button type="button" onClick={onCreateCampaign}>
        + New Campaign
      </Button>
    </div>
  );
}

import { Button } from "@/components/ui/button";

interface CampaignsEmptyStateProps {
  onCreateCampaign: () => void;
}

export function CampaignsEmptyState({ onCreateCampaign }: CampaignsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-sm font-semibold text-foreground">No campaigns found</p>
      <p className="text-sm text-foreground-muted">Try a different search, or create a new campaign.</p>
      <Button onClick={onCreateCampaign} className="mt-2">
        New Campaign
      </Button>
    </div>
  );
}

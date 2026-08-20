import { CampaignService } from "./campaign-service";

const DEFAULT_INTERVAL_MS = 30_000;

export class CampaignScheduler {
  private intervalHandle: NodeJS.Timeout | undefined;

  constructor(
    private readonly campaignService: CampaignService = new CampaignService(),
    private readonly intervalMs: number = Number(process.env.CAMPAIGN_SCHEDULER_INTERVAL_MS) || DEFAULT_INTERVAL_MS
  ) {}

  start(): void {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(() => {
      this.campaignService.processDueScheduledCampaigns().catch((error) => {
        console.error("CampaignScheduler failed to process due campaigns", error);
      });
    }, this.intervalMs);
    this.intervalHandle.unref();
  }

  stop(): void {
    if (!this.intervalHandle) return;
    clearInterval(this.intervalHandle);
    this.intervalHandle = undefined;
  }
}

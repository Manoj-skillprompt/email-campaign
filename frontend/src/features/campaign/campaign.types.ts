import type { Campaign } from "@email-campaign-v2/contracts";

export type {
  Campaign,
  CampaignStatus,
  CreateCampaignInput,
  UpdateCampaignInput,
  ScheduleCampaignInput,
} from "@email-campaign-v2/contracts";
export { ALLOWED_SENDERS } from "@email-campaign-v2/contracts";

export interface CampaignWithAudience extends Campaign {
  audienceLabel: string;
}

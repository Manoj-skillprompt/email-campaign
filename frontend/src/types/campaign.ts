export type CampaignStatus = "Draft" | "Scheduled" | "Sending" | "Sent" | "Failed" | "Cancelled";

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  sender: string;
  body: string;
  targetGroupIds: string[];
  status: CampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignInput {
  name: string;
  subject: string;
  sender: string;
  body: string;
  targetGroupIds: string[];
}

export type UpdateCampaignInput = Partial<CreateCampaignInput>;

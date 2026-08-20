import type { Campaign } from "@/types/campaign";
import type { CampaignTargetGroup } from "@/types/campaign-target-group";

export const DEFAULT_CAMPAIGN_BODY = `Hi {{name}},

Write your email here...

Best,
The Team`;

export const DEFAULT_CAMPAIGN_SENDER = "info@emailcampaign.com";

export const MOCK_TARGET_GROUPS: CampaignTargetGroup[] = [
  { id: "grp-1", name: "Sydney Visa Pending Clients", contactIds: ["ct-1", "ct-2", "ct-3"] },
  { id: "grp-2", name: "Melbourne Newsletter Subscribers", contactIds: ["ct-3", "ct-4", "ct-5", "ct-6"] },
  { id: "grp-3", name: "Small Real Email Group", contactIds: ["ct-1", "ct-7"] },
];

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "cmp-1",
    name: "Welcome Series - August",
    subject: "Welcome to the team!",
    sender: DEFAULT_CAMPAIGN_SENDER,
    body: DEFAULT_CAMPAIGN_BODY,
    targetGroupIds: ["grp-1"],
    status: "Draft",
    scheduledAt: null,
    sentAt: null,
    createdAt: "2026-08-14T09:00:00.000Z",
    updatedAt: "2026-08-14T09:00:00.000Z",
  },
  {
    id: "cmp-2",
    name: "Visa Update Reminder",
    subject: "Action needed on your visa application",
    sender: DEFAULT_CAMPAIGN_SENDER,
    body: DEFAULT_CAMPAIGN_BODY,
    targetGroupIds: ["grp-1", "grp-3"],
    status: "Scheduled",
    scheduledAt: "2026-08-23T02:00:00.000Z",
    sentAt: null,
    createdAt: "2026-08-16T10:30:00.000Z",
    updatedAt: "2026-08-18T04:15:00.000Z",
  },
  {
    id: "cmp-3",
    name: "Monthly Newsletter - July",
    subject: "Your July highlights",
    sender: DEFAULT_CAMPAIGN_SENDER,
    body: DEFAULT_CAMPAIGN_BODY,
    targetGroupIds: ["grp-2"],
    status: "Sent",
    scheduledAt: null,
    sentAt: "2026-07-23T06:00:00.000Z",
    createdAt: "2026-07-20T08:00:00.000Z",
    updatedAt: "2026-07-23T06:00:00.000Z",
  },
  {
    id: "cmp-4",
    name: "Client Satisfaction Survey",
    subject: "We would love your feedback",
    sender: DEFAULT_CAMPAIGN_SENDER,
    body: DEFAULT_CAMPAIGN_BODY,
    targetGroupIds: ["grp-2", "grp-3"],
    status: "Sent",
    scheduledAt: null,
    sentAt: "2026-07-16T05:45:00.000Z",
    createdAt: "2026-07-14T03:00:00.000Z",
    updatedAt: "2026-07-16T05:45:00.000Z",
  },
];

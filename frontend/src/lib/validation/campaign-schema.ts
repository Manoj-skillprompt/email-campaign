import { z } from "zod";

export const campaignFormSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required"),
  subject: z.string().trim().min(1, "Subject is required"),
  sender: z.string().trim().min(1, "Sender email is required").email("Enter a valid email address"),
  body: z.string().trim().min(1, "Body is required"),
  targetGroupIds: z.array(z.string()).min(1, "Select at least one target group"),
});

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;

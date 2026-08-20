import { initContract } from "@ts-rest/core";
import { z } from "zod";

import { errorResponseSchema } from "./contacts";

const c = initContract();

export const campaignStatusSchema = z.enum(["Draft", "Scheduled", "Sending", "Sent", "Failed", "Cancelled"]);

export const campaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  subject: z.string(),
  sender: z.string(),
  body: z.string(),
  targetGroupIds: z.array(z.string()),
  status: campaignStatusSchema,
  scheduledAt: z.string().nullable(),
  sentAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createCampaignInputSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required"),
  subject: z.string().trim().min(1, "Subject is required"),
  sender: z.string().trim().email("Enter a valid email address").optional(),
  body: z.string().trim().min(1, "Body is required"),
  targetGroupIds: z.array(z.string()).min(1, "Select at least one target group"),
});

export const updateCampaignInputSchema = createCampaignInputSchema.partial();

export const scheduleCampaignInputSchema = z.object({
  scheduledAt: z.string().min(1, "Scheduled date/time is required"),
});

export type CampaignStatus = z.infer<typeof campaignStatusSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignInputSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignInputSchema>;
export type ScheduleCampaignInput = z.infer<typeof scheduleCampaignInputSchema>;

export const campaignsContract = c.router({
  getCampaigns: {
    method: "GET",
    path: "/campaigns",
    query: z.object({ status: campaignStatusSchema.optional(), search: z.string().optional() }),
    responses: {
      200: z.array(campaignSchema),
    },
    summary: "List campaigns, optionally filtered by status and a case-insensitive name search term",
  },
  createCampaign: {
    method: "POST",
    path: "/campaigns",
    body: createCampaignInputSchema,
    responses: {
      201: campaignSchema,
      400: errorResponseSchema,
    },
    summary: "Create a campaign",
  },
  getCampaignById: {
    method: "GET",
    path: "/campaigns/:id",
    pathParams: z.object({ id: z.string() }),
    responses: {
      200: campaignSchema,
      404: errorResponseSchema,
    },
    summary: "Get a campaign by id",
  },
  updateCampaign: {
    method: "PATCH",
    path: "/campaigns/:id",
    pathParams: z.object({ id: z.string() }),
    body: updateCampaignInputSchema,
    responses: {
      200: campaignSchema,
      400: errorResponseSchema,
      404: errorResponseSchema,
      409: errorResponseSchema,
    },
    summary: "Update a Draft campaign",
  },
  scheduleCampaign: {
    method: "POST",
    path: "/campaigns/:id/schedule",
    pathParams: z.object({ id: z.string() }),
    body: scheduleCampaignInputSchema,
    responses: {
      200: campaignSchema,
      400: errorResponseSchema,
      404: errorResponseSchema,
      409: errorResponseSchema,
    },
    summary: "Schedule a Draft campaign for future delivery",
  },
  sendNow: {
    method: "POST",
    path: "/campaigns/:id/send",
    pathParams: z.object({ id: z.string() }),
    body: c.noBody(),
    responses: {
      200: campaignSchema,
      404: errorResponseSchema,
      409: errorResponseSchema,
    },
    summary: "Send a campaign immediately",
  },
  duplicateCampaign: {
    method: "POST",
    path: "/campaigns/:id/duplicate",
    pathParams: z.object({ id: z.string() }),
    body: c.noBody(),
    responses: {
      201: campaignSchema,
      404: errorResponseSchema,
    },
    summary: "Duplicate a campaign as a new Draft",
  },
});

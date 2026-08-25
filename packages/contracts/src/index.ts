// Shared ts-rest contracts and Zod schemas
import { initContract } from "@ts-rest/core";
import { z } from "zod";

export const contactSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  branch: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Contact = z.infer<typeof contactSchema>;

export const createContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  branch: z.string().min(1, "Branch is required"),
});
export type CreateContactInput = z.infer<typeof createContactSchema>;

export const updateContactSchema = createContactSchema.partial();
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

export const listContactsQuerySchema = z.object({
  search: z.string().optional(),
});
export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;

export const errorResponseSchema = z.object({
  message: z.string(),
});

const c = initContract();

export const groupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  contactIds: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Group = z.infer<typeof groupSchema>;

export const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = createGroupSchema.partial();
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const listGroupsQuerySchema = z.object({
  search: z.string().optional(),
});
export type ListGroupsQuery = z.infer<typeof listGroupsQuerySchema>;

export const assignContactSchema = z.object({
  contactId: z.string(),
});
export type AssignContactInput = z.infer<typeof assignContactSchema>;

export const groupsContract = c.router({
  createGroup: {
    method: "POST",
    path: "/groups",
    body: createGroupSchema,
    responses: {
      201: groupSchema,
      409: errorResponseSchema,
    },
  },
  listGroups: {
    method: "GET",
    path: "/groups",
    query: listGroupsQuerySchema,
    responses: {
      200: z.array(groupSchema),
    },
  },
  updateGroup: {
    method: "PATCH",
    path: "/groups/:id",
    pathParams: z.object({ id: z.string() }),
    body: updateGroupSchema,
    responses: {
      200: groupSchema,
      404: errorResponseSchema,
      409: errorResponseSchema,
    },
  },
  deleteGroup: {
    method: "DELETE",
    path: "/groups/:id",
    pathParams: z.object({ id: z.string() }),
    body: c.noBody(),
    responses: {
      204: c.noBody(),
      404: errorResponseSchema,
    },
  },
  assignContact: {
    method: "POST",
    path: "/groups/:id/contacts",
    pathParams: z.object({ id: z.string() }),
    body: assignContactSchema,
    responses: {
      200: groupSchema,
      404: errorResponseSchema,
    },
  },
  unassignContact: {
    method: "DELETE",
    path: "/groups/:id/contacts/:contactId",
    pathParams: z.object({ id: z.string(), contactId: z.string() }),
    body: c.noBody(),
    responses: {
      200: groupSchema,
      404: errorResponseSchema,
    },
  },
});

export const contactsContract = c.router({
  createContact: {
    method: "POST",
    path: "/contacts",
    body: createContactSchema,
    responses: {
      201: contactSchema,
      409: errorResponseSchema,
    },
  },
  listContacts: {
    method: "GET",
    path: "/contacts",
    query: listContactsQuerySchema,
    responses: {
      200: z.array(contactSchema),
    },
  },
  updateContact: {
    method: "PATCH",
    path: "/contacts/:id",
    pathParams: z.object({ id: z.string() }),
    body: updateContactSchema,
    responses: {
      200: contactSchema,
      404: errorResponseSchema,
      409: errorResponseSchema,
    },
  },
  deleteContact: {
    method: "DELETE",
    path: "/contacts/:id",
    pathParams: z.object({ id: z.string() }),
    body: c.noBody(),
    responses: {
      204: c.noBody(),
      404: errorResponseSchema,
    },
  },
});

export const ALLOWED_SENDERS = [
  { email: "info@skillprompt.com", label: "Skillprompt <info@skillprompt.com>" },
  { email: "no-reply@skillprompt.com", label: "Skillprompt Updates <no-reply@skillprompt.com>" },
  { email: "support@skillprompt.com", label: "Skillprompt Support <support@skillprompt.com>" },
] as const;

export const campaignStatusSchema = z.enum(["DRAFT", "SCHEDULED", "SENT"]);
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;

export const campaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  subject: z.string(),
  senderEmail: z.string(),
  type: z.literal("EMAIL"),
  groupIds: z.array(z.string()),
  content: z.string(),
  status: campaignStatusSchema,
  scheduledAt: z.string().nullable(),
  sentAt: z.string().nullable(),
  sentCount: z.number(),
  openRate: z.number(),
  clickRate: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Campaign = z.infer<typeof campaignSchema>;

export const createCampaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().optional(),
  senderEmail: z.string().optional(),
  groupIds: z.array(z.string()).optional(),
  content: z.string().optional(),
});
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  subject: z.string().optional(),
  senderEmail: z.string().optional(),
  groupIds: z.array(z.string()).optional(),
  content: z.string().optional(),
});
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

export const scheduleCampaignSchema = z.object({
  scheduledAt: z.string().min(1, "Scheduled date/time is required"),
});
export type ScheduleCampaignInput = z.infer<typeof scheduleCampaignSchema>;

export const listCampaignsQuerySchema = z.object({
  search: z.string().optional(),
  status: campaignStatusSchema.optional(),
});
export type ListCampaignsQuery = z.infer<typeof listCampaignsQuerySchema>;

export const campaignsContract = c.router({
  createCampaign: {
    method: "POST",
    path: "/campaigns",
    body: createCampaignSchema,
    responses: {
      201: campaignSchema,
    },
  },
  listCampaigns: {
    method: "GET",
    path: "/campaigns",
    query: listCampaignsQuerySchema,
    responses: {
      200: z.array(campaignSchema),
    },
  },
  updateCampaign: {
    method: "PATCH",
    path: "/campaigns/:id",
    pathParams: z.object({ id: z.string() }),
    body: updateCampaignSchema,
    responses: {
      200: campaignSchema,
      404: errorResponseSchema,
      409: errorResponseSchema,
    },
  },
  scheduleCampaign: {
    method: "POST",
    path: "/campaigns/:id/schedule",
    pathParams: z.object({ id: z.string() }),
    body: scheduleCampaignSchema,
    responses: {
      200: campaignSchema,
      404: errorResponseSchema,
      400: errorResponseSchema,
      409: errorResponseSchema,
    },
  },
  sendCampaignNow: {
    method: "POST",
    path: "/campaigns/:id/send",
    pathParams: z.object({ id: z.string() }),
    body: c.noBody(),
    responses: {
      200: campaignSchema,
      404: errorResponseSchema,
      400: errorResponseSchema,
      409: errorResponseSchema,
    },
  },
  deleteCampaign: {
    method: "DELETE",
    path: "/campaigns/:id",
    pathParams: z.object({ id: z.string() }),
    body: c.noBody(),
    responses: {
      204: c.noBody(),
      404: errorResponseSchema,
    },
  },
});

import { initContract } from "@ts-rest/core";
import { z } from "zod";

import { errorResponseSchema } from "./contacts";

const c = initContract();

export const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  contactCount: z.number().int().nonnegative(),
  contactIds: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createGroupInputSchema = z.object({
  name: z.string().trim().min(1, "Group name is required"),
  contactIds: z.array(z.string()).optional(),
});

export const updateGroupInputSchema = z.object({
  name: z.string().trim().min(1, "Group name is required").optional(),
  addContactIds: z.array(z.string()).optional(),
  removeContactIds: z.array(z.string()).optional(),
});

export type Group = z.infer<typeof groupSchema>;
export type CreateGroupInput = z.infer<typeof createGroupInputSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupInputSchema>;

export const groupsContract = c.router({
  getGroups: {
    method: "GET",
    path: "/groups",
    query: z.object({ search: z.string().optional() }),
    responses: {
      200: z.array(groupSchema),
    },
    summary: "List groups, optionally filtered by a case-insensitive name search term",
  },
  createGroup: {
    method: "POST",
    path: "/groups",
    body: createGroupInputSchema,
    responses: {
      201: groupSchema,
      400: errorResponseSchema,
      409: errorResponseSchema,
    },
    summary: "Create a group",
  },
  updateGroup: {
    method: "PATCH",
    path: "/groups/:id",
    pathParams: z.object({ id: z.string() }),
    body: updateGroupInputSchema,
    responses: {
      200: groupSchema,
      400: errorResponseSchema,
      404: errorResponseSchema,
      409: errorResponseSchema,
    },
    summary: "Update a group",
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
    summary: "Delete a group",
  },
});

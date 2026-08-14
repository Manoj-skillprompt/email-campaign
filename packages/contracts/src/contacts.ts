import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const contactSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  name: z.string(),
  email: z.string().email(),
  branch: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createContactInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  branch: z.string().trim().min(1, "Branch is required"),
});

export const updateContactInputSchema = createContactInputSchema.partial();

export const errorResponseSchema = z
  .object({
    message: z.string(),
  })
  .passthrough();

export type Contact = z.infer<typeof contactSchema>;
export type CreateContactInput = z.infer<typeof createContactInputSchema>;
export type UpdateContactInput = z.infer<typeof updateContactInputSchema>;

export const contactsContract = c.router({
  listContacts: {
    method: "GET",
    path: "/contacts",
    query: z.object({ search: z.string().optional() }),
    responses: {
      200: z.array(contactSchema),
    },
    summary: "List contacts, optionally filtered by a case-insensitive search term",
  },
  createContact: {
    method: "POST",
    path: "/contacts",
    body: createContactInputSchema,
    responses: {
      201: contactSchema,
      400: errorResponseSchema,
      409: errorResponseSchema,
    },
    summary: "Create a contact",
  },
  updateContact: {
    method: "PATCH",
    path: "/contacts/:id",
    pathParams: z.object({ id: z.string() }),
    body: updateContactInputSchema,
    responses: {
      200: contactSchema,
      400: errorResponseSchema,
      404: errorResponseSchema,
      409: errorResponseSchema,
    },
    summary: "Update a contact",
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
    summary: "Delete a contact",
  },
});

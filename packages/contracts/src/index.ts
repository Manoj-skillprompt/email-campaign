// Shared ts-rest contracts and Zod schemas
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

import { z } from "zod";

export function buildContactFormSchema(existingEmails: Set<string>, currentEmail?: string) {
  return z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address")
      .refine(
        (email) => email.toLowerCase() === currentEmail?.toLowerCase() || !existingEmails.has(email.toLowerCase()),
        "A contact with this email already exists"
      ),
    branch: z.string().trim().min(1, "Branch is required"),
  });
}

export type ContactFormValues = z.infer<ReturnType<typeof buildContactFormSchema>>;

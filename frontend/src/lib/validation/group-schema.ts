import { z } from "zod";

export function buildGroupFormSchema(existingNames: Set<string>, currentName?: string) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, "Group name is required")
      .refine(
        (name) => name.toLowerCase() === currentName?.toLowerCase() || !existingNames.has(name.toLowerCase()),
        "A group with this name already exists"
      ),
    contactIds: z.array(z.string()),
  });
}

export type GroupFormValues = z.infer<ReturnType<typeof buildGroupFormSchema>>;

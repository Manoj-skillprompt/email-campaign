import type { Contact } from "@email-campaign-v2/contracts";

export type { Contact, CreateContactInput, UpdateContactInput } from "@email-campaign-v2/contracts";

export interface ContactWithGroup extends Contact {
  groupLabel: string;
}

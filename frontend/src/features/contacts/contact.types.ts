import type { Contact } from "@email-campaign-v2/contracts";

export type { Contact, CreateContactInput, UpdateContactInput } from "@email-campaign-v2/contracts";

export interface ContactWithGroup extends Contact {
  groupLabel: string;
}

// Temporary client-side mirror of FDS Section 5's PaginatedContacts envelope; replace with the generated contract type once Backend phase ships real pagination.
export interface PaginatedContactsMock<T = Contact> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

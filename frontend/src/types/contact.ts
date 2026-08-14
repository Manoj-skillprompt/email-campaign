export interface Contact {
  id: string;
  clientId: string;
  name: string;
  email: string;
  branch: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactInput {
  name: string;
  email: string;
  branch: string;
}

export type UpdateContactInput = Partial<CreateContactInput>;

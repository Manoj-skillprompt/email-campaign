export interface Group {
  id: string;
  name: string;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupInput {
  name: string;
  contactIds?: string[];
}

export interface UpdateGroupInput {
  name?: string;
  addContactIds?: string[];
  removeContactIds?: string[];
}

import type { Contact, CreateContactInput, PaginatedContacts, UpdateContactInput } from "@email-campaign-v2/contracts";
import { randomInt, randomUUID } from "node:crypto";

import { ContactNotFoundError, DuplicateEmailError } from "./contact-errors";
import { contactRepository, type ContactRepository } from "./contact-repository";

export function generateUniqueClientId(
  usedClientIds: Set<string>,
  randomFn: () => number = () => randomInt(0, 10000)
): string {
  let clientId: string;
  do {
    clientId = randomFn().toString().padStart(4, "0");
  } while (usedClientIds.has(clientId));
  return clientId;
}

export class ContactService {
  constructor(private readonly repository: ContactRepository = contactRepository) {}

  async createContact(input: CreateContactInput): Promise<Contact> {
    const existing = await this.repository.findByEmail(input.email);
    if (existing) {
      throw new DuplicateEmailError(input.email);
    }

    const existingContacts = await this.repository.findAll();
    const usedClientIds = new Set(existingContacts.map((contact) => contact.clientId));

    const now = new Date().toISOString();
    const contact: Contact = {
      id: randomUUID(),
      clientId: generateUniqueClientId(usedClientIds),
      name: input.name,
      email: input.email,
      branch: input.branch,
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.create(contact);
  }

  async listContacts(options: { search?: string; page: number; pageSize: number }): Promise<PaginatedContacts> {
    const { search, page, pageSize } = options;
    const { data, total } = await this.repository.findPage({ search, page, pageSize });
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return { data, page, pageSize, total, totalPages };
  }

  async getContactById(id: string): Promise<Contact | undefined> {
    return this.repository.findById(id);
  }

  async updateContact(id: string, input: UpdateContactInput): Promise<Contact> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new ContactNotFoundError(id);
    }

    if (input.email && input.email !== existing.email) {
      const duplicate = await this.repository.findByEmail(input.email);
      if (duplicate) {
        throw new DuplicateEmailError(input.email);
      }
    }

    return this.repository.update(id, { ...input, updatedAt: new Date().toISOString() });
  }

  async deleteContact(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new ContactNotFoundError(id);
    }
    await this.repository.delete(id);
  }
}

export const contactService = new ContactService();

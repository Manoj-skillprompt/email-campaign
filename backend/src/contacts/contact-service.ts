import type { Contact, CreateContactInput, UpdateContactInput } from "@email-campaign-v2/contracts";
import { randomUUID } from "node:crypto";

import { ContactNotFoundError, DuplicateEmailError } from "./contact-errors";
import { contactRepository, type ContactRepository } from "./contact-repository";

export class ContactService {
  constructor(private readonly repository: ContactRepository = contactRepository) {}

  async createContact(input: CreateContactInput): Promise<Contact> {
    const existing = await this.repository.findByEmail(input.email);
    if (existing) {
      throw new DuplicateEmailError(input.email);
    }

    const now = new Date().toISOString();
    const contact: Contact = {
      id: randomUUID(),
      clientId: `LOCAL-${randomUUID()}`,
      name: input.name,
      email: input.email,
      branch: input.branch,
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.create(contact);
  }

  async listContacts(search?: string): Promise<Contact[]> {
    return this.repository.findAll(search);
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

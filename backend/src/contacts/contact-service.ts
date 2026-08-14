import { randomUUID } from "node:crypto";

import type { Contact, CreateContactInput, UpdateContactInput } from "@email-campaign-v2/contracts";

import { ConflictError, NotFoundError } from "./contact-errors";
import { ContactRepository } from "./contact-repository";

function generateClientId(): string {
  return `LOCAL-${randomUUID().slice(0, 8)}`;
}

export class ContactService {
  constructor(private readonly contactRepository: ContactRepository = new ContactRepository()) {}

  async getContacts(search?: string): Promise<Contact[]> {
    return this.contactRepository.findAll(search);
  }

  async createContact(input: CreateContactInput): Promise<Contact> {
    const existing = await this.contactRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError(`A contact with email "${input.email}" already exists`);
    }

    const now = new Date().toISOString();
    const contact: Contact = {
      id: randomUUID(),
      clientId: generateClientId(),
      name: input.name,
      email: input.email,
      branch: input.branch,
      createdAt: now,
      updatedAt: now,
    };

    return this.contactRepository.create(contact);
  }

  async updateContact(id: string, input: UpdateContactInput): Promise<Contact> {
    const existing = await this.contactRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Contact "${id}" was not found`);
    }

    if (input.email) {
      const conflicting = await this.contactRepository.findByEmail(input.email, id);
      if (conflicting) {
        throw new ConflictError(`A contact with email "${input.email}" already exists`);
      }
    }

    const updated = await this.contactRepository.update(id, {
      ...input,
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      throw new NotFoundError(`Contact "${id}" was not found`);
    }

    return updated;
  }

  async deleteContact(id: string): Promise<void> {
    const existing = await this.contactRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Contact "${id}" was not found`);
    }
    await this.contactRepository.delete(id);
  }
}

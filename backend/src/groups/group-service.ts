import { randomUUID } from "node:crypto";

import type { CreateGroupInput, Group, UpdateGroupInput } from "@email-campaign-v2/contracts";

import { ContactRepository } from "../contacts/contact-repository";
import { ConflictError, NotFoundError, ValidationError } from "./group-errors";
import { GroupRepository, type GroupRow } from "./group-repository";

export class GroupService {
  constructor(
    private readonly groupRepository: GroupRepository = new GroupRepository(),
    private readonly contactRepository: ContactRepository = new ContactRepository()
  ) {}

  async getGroups(search?: string): Promise<Group[]> {
    const rows = await this.groupRepository.findAll(search);
    return Promise.all(rows.map((row) => this.toGroup(row)));
  }

  async createGroup(input: CreateGroupInput): Promise<Group> {
    const existing = await this.groupRepository.findByName(input.name);
    if (existing) {
      throw new ConflictError(`A group with name "${input.name}" already exists`);
    }

    const contactIds = [...new Set(input.contactIds ?? [])];
    if (contactIds.length > 0) {
      await this.assertContactsExist(contactIds);
    }

    const now = new Date().toISOString();
    const row: GroupRow = {
      id: randomUUID(),
      name: input.name,
      createdAt: now,
      updatedAt: now,
    };

    await this.groupRepository.create(row);
    if (contactIds.length > 0) {
      await this.groupRepository.addContacts(row.id, contactIds);
    }

    return this.toGroup(row);
  }

  async updateGroup(id: string, input: UpdateGroupInput): Promise<Group> {
    const existing = await this.groupRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Group "${id}" was not found`);
    }

    if (input.name) {
      const conflicting = await this.groupRepository.findByName(input.name, id);
      if (conflicting) {
        throw new ConflictError(`A group with name "${input.name}" already exists`);
      }
    }

    if (input.addContactIds && input.addContactIds.length > 0) {
      await this.assertContactsExist(input.addContactIds);
    }

    const updated = await this.groupRepository.update(id, {
      ...(input.name ? { name: input.name } : {}),
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      throw new NotFoundError(`Group "${id}" was not found`);
    }

    if (input.addContactIds && input.addContactIds.length > 0) {
      await this.groupRepository.addContacts(id, [...new Set(input.addContactIds)]);
    }

    if (input.removeContactIds && input.removeContactIds.length > 0) {
      await this.groupRepository.removeContacts(id, [...new Set(input.removeContactIds)]);
    }

    return this.toGroup(updated);
  }

  async deleteGroup(id: string): Promise<void> {
    const existing = await this.groupRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Group "${id}" was not found`);
    }
    await this.groupRepository.delete(id);
  }

  private async assertContactsExist(contactIds: string[]): Promise<void> {
    const found = await this.contactRepository.findByIds(contactIds);
    const foundIds = new Set(found.map((contact) => contact.id));
    const missing = contactIds.filter((id) => !foundIds.has(id));

    if (missing.length > 0) {
      throw new ValidationError(`Unknown contact id(s): ${missing.join(", ")}`);
    }
  }

  private async toGroup(row: GroupRow): Promise<Group> {
    const contactCount = await this.groupRepository.countContacts(row.id);
    return { ...row, contactCount };
  }
}

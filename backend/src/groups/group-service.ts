import type { CreateGroupInput, Group, UpdateGroupInput } from "@email-campaign-v2/contracts";
import { randomUUID } from "node:crypto";

import { ContactNotFoundError } from "../contacts/contact-errors";
import { contactService, type ContactService } from "../contacts/contact-service";
import { DuplicateGroupNameError, GroupNotFoundError } from "./group-errors";
import { groupRepository, type GroupRepository } from "./group-repository";

export class GroupService {
  constructor(
    private readonly repository: GroupRepository = groupRepository,
    private readonly contacts: ContactService = contactService
  ) {}

  async createGroup(input: CreateGroupInput): Promise<Group> {
    const existing = await this.repository.findByName(input.name);
    if (existing) {
      throw new DuplicateGroupNameError(input.name);
    }

    const now = new Date().toISOString();
    const group: Group = {
      id: randomUUID(),
      name: input.name,
      contactIds: [],
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.create(group);
  }

  async listGroups(search?: string): Promise<Group[]> {
    return this.repository.findAll(search);
  }

  async updateGroup(id: string, input: UpdateGroupInput): Promise<Group> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new GroupNotFoundError(id);
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await this.repository.findByName(input.name);
      if (duplicate) {
        throw new DuplicateGroupNameError(input.name);
      }
    }

    return this.repository.update(id, { ...input, updatedAt: new Date().toISOString() });
  }

  async deleteGroup(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new GroupNotFoundError(id);
    }
    await this.repository.delete(id);
  }

  async assignContactToGroup(groupId: string, contactId: string): Promise<Group> {
    const target = await this.repository.findById(groupId);
    if (!target) {
      throw new GroupNotFoundError(groupId);
    }

    const contact = await this.contacts.getContactById(contactId);
    if (!contact) {
      throw new ContactNotFoundError(contactId);
    }

    const currentGroup = await this.repository.findByContactId(contactId);
    if (currentGroup && currentGroup.id !== groupId) {
      await this.repository.update(currentGroup.id, {
        contactIds: currentGroup.contactIds.filter((id) => id !== contactId),
        updatedAt: new Date().toISOString(),
      });
    }

    if (target.contactIds.includes(contactId)) {
      return target;
    }

    return this.repository.update(groupId, {
      contactIds: [...target.contactIds, contactId],
      updatedAt: new Date().toISOString(),
    });
  }

  async unassignContactFromGroup(groupId: string, contactId: string): Promise<Group> {
    const target = await this.repository.findById(groupId);
    if (!target) {
      throw new GroupNotFoundError(groupId);
    }

    return this.repository.update(groupId, {
      contactIds: target.contactIds.filter((id) => id !== contactId),
      updatedAt: new Date().toISOString(),
    });
  }
}

export const groupService = new GroupService();

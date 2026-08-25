import type { Group } from "./group.types";
import { initialMockGroups, type MockContactRef } from "./groups.mock-data";

export class DuplicateGroupNameError extends Error {
  constructor(name: string) {
    super(`A group with name "${name}" already exists.`);
    this.name = "DuplicateGroupNameError";
  }
}

export class GroupNotFoundError extends Error {
  constructor(id: string) {
    super(`Group with id "${id}" was not found.`);
    this.name = "GroupNotFoundError";
  }
}

export interface GroupWithMembers extends Group {
  members: MockContactRef[];
}

let mockGroups: GroupWithMembers[] = initialMockGroups.map((group) => ({
  id: group.id,
  name: group.name,
  contactIds: group.members.map((member) => member.id),
  members: group.members,
  createdAt: group.createdAt,
  updatedAt: group.updatedAt,
}));

const MOCK_LATENCY_MS = 150;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

function matchesSearch(group: GroupWithMembers, search: string): boolean {
  return group.name.toLowerCase().includes(search.toLowerCase());
}

function findByName(name: string, excludeId?: string): GroupWithMembers | undefined {
  return mockGroups.find((group) => group.name.toLowerCase() === name.toLowerCase() && group.id !== excludeId);
}

export async function listGroups(params?: { search?: string }): Promise<GroupWithMembers[]> {
  const search = params?.search?.trim();
  const results = search ? mockGroups.filter((group) => matchesSearch(group, search)) : mockGroups;
  return delay(results.map((group) => ({ ...group })));
}

export async function createGroup(input: { name: string }): Promise<GroupWithMembers> {
  if (findByName(input.name)) {
    throw new DuplicateGroupNameError(input.name);
  }

  const now = new Date().toISOString();
  const group: GroupWithMembers = {
    id: crypto.randomUUID(),
    name: input.name,
    contactIds: [],
    members: [],
    createdAt: now,
    updatedAt: now,
  };
  mockGroups = [group, ...mockGroups];
  return delay({ ...group });
}

export async function updateGroup(id: string, input: { name?: string }): Promise<GroupWithMembers> {
  const existing = mockGroups.find((group) => group.id === id);
  if (!existing) {
    throw new GroupNotFoundError(id);
  }
  if (input.name && findByName(input.name, id)) {
    throw new DuplicateGroupNameError(input.name);
  }

  const updated: GroupWithMembers = { ...existing, ...input, updatedAt: new Date().toISOString() };
  mockGroups = mockGroups.map((group) => (group.id === id ? updated : group));
  return delay({ ...updated });
}

export async function deleteGroup(id: string): Promise<void> {
  const existing = mockGroups.find((group) => group.id === id);
  if (!existing) {
    throw new GroupNotFoundError(id);
  }
  mockGroups = mockGroups.filter((group) => group.id !== id);
  return delay(undefined);
}

export async function assignContactToGroup(groupId: string, contact: MockContactRef): Promise<GroupWithMembers> {
  const target = mockGroups.find((group) => group.id === groupId);
  if (!target) {
    throw new GroupNotFoundError(groupId);
  }

  mockGroups = mockGroups.map((group) => {
    if (group.id === groupId || !group.contactIds.includes(contact.id)) {
      return group;
    }
    return {
      ...group,
      contactIds: group.contactIds.filter((id) => id !== contact.id),
      members: group.members.filter((member) => member.id !== contact.id),
      updatedAt: new Date().toISOString(),
    };
  });

  const updatedTarget: GroupWithMembers = {
    ...target,
    contactIds: target.contactIds.includes(contact.id) ? target.contactIds : [...target.contactIds, contact.id],
    members: target.members.some((member) => member.id === contact.id) ? target.members : [...target.members, contact],
    updatedAt: new Date().toISOString(),
  };
  mockGroups = mockGroups.map((group) => (group.id === groupId ? updatedTarget : group));

  return delay({ ...updatedTarget });
}

export async function unassignContactFromGroup(groupId: string, contactId: string): Promise<GroupWithMembers> {
  const target = mockGroups.find((group) => group.id === groupId);
  if (!target) {
    throw new GroupNotFoundError(groupId);
  }

  const updated: GroupWithMembers = {
    ...target,
    contactIds: target.contactIds.filter((id) => id !== contactId),
    members: target.members.filter((member) => member.id !== contactId),
    updatedAt: new Date().toISOString(),
  };
  mockGroups = mockGroups.map((group) => (group.id === groupId ? updated : group));
  return delay({ ...updated });
}

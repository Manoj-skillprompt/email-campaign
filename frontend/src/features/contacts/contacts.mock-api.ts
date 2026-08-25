import type { Contact, CreateContactInput, UpdateContactInput } from "./contact.types";
import { initialMockContacts } from "./contacts.mock-data";

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`A contact with email "${email}" already exists.`);
    this.name = "DuplicateEmailError";
  }
}

export class ContactNotFoundError extends Error {
  constructor(id: string) {
    super(`Contact with id "${id}" was not found.`);
    this.name = "ContactNotFoundError";
  }
}

let mockContacts: Contact[] = [...initialMockContacts];
let nextLocalContactNumber = mockContacts.length + 1;

const MOCK_LATENCY_MS = 150;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

function matchesSearch(contact: Contact, search: string): boolean {
  const term = search.toLowerCase();
  return (
    contact.name.toLowerCase().includes(term) ||
    contact.email.toLowerCase().includes(term) ||
    contact.branch.toLowerCase().includes(term)
  );
}

function findByEmail(email: string, excludeId?: string): Contact | undefined {
  return mockContacts.find(
    (contact) => contact.email.toLowerCase() === email.toLowerCase() && contact.id !== excludeId
  );
}

export async function listContacts(params?: { search?: string }): Promise<Contact[]> {
  const search = params?.search?.trim();
  const results = search ? mockContacts.filter((contact) => matchesSearch(contact, search)) : mockContacts;
  return delay([...results]);
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  if (findByEmail(input.email)) {
    throw new DuplicateEmailError(input.email);
  }

  const now = new Date().toISOString();
  const contact: Contact = {
    id: crypto.randomUUID(),
    clientId: `LOCAL-${nextLocalContactNumber}`,
    name: input.name,
    email: input.email,
    branch: input.branch,
    createdAt: now,
    updatedAt: now,
  };
  nextLocalContactNumber += 1;
  mockContacts = [contact, ...mockContacts];
  return delay(contact);
}

export async function updateContact(id: string, input: UpdateContactInput): Promise<Contact> {
  const existing = mockContacts.find((contact) => contact.id === id);
  if (!existing) {
    throw new ContactNotFoundError(id);
  }
  if (input.email && findByEmail(input.email, id)) {
    throw new DuplicateEmailError(input.email);
  }

  const updated: Contact = { ...existing, ...input, updatedAt: new Date().toISOString() };
  mockContacts = mockContacts.map((contact) => (contact.id === id ? updated : contact));
  return delay(updated);
}

export async function deleteContact(id: string): Promise<void> {
  const existing = mockContacts.find((contact) => contact.id === id);
  if (!existing) {
    throw new ContactNotFoundError(id);
  }
  mockContacts = mockContacts.filter((contact) => contact.id !== id);
  return delay(undefined);
}

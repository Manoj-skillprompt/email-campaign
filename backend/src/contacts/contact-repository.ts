import type { Contact } from "@email-campaign-v2/contracts";
import { eq, sql } from "drizzle-orm";

import { db } from "../db/client";
import { contacts } from "../db/schema";

function toSearchPattern(term: string): string {
  return `%${term.toLowerCase()}%`;
}

function searchCondition(search: string) {
  const pattern = toSearchPattern(search);
  return sql`(lower(${contacts.name}) like ${pattern} or lower(${contacts.email}) like ${pattern} or lower(${contacts.branch}) like ${pattern})`;
}

export interface ListContactsPage {
  data: Contact[];
  total: number;
}

export class ContactRepository {
  async create(contact: Contact): Promise<Contact> {
    await db.insert(contacts).values(contact);
    return contact;
  }

  async findAll(search?: string): Promise<Contact[]> {
    if (!search) {
      return db.select().from(contacts);
    }

    return db.select().from(contacts).where(searchCondition(search));
  }

  async findPage(options: { search?: string; page: number; pageSize: number }): Promise<ListContactsPage> {
    const { search, page, pageSize } = options;
    const condition = search ? searchCondition(search) : undefined;

    const dataQuery = condition
      ? db.select().from(contacts).where(condition)
      : db.select().from(contacts);
    const countQuery = condition
      ? db.select({ count: sql<number>`count(*)` }).from(contacts).where(condition)
      : db.select({ count: sql<number>`count(*)` }).from(contacts);

    const [data, countRows] = await Promise.all([
      dataQuery.limit(pageSize).offset((page - 1) * pageSize),
      countQuery,
    ]);

    return { data, total: Number(countRows[0]?.count ?? 0) };
  }

  async findById(id: string): Promise<Contact | undefined> {
    const [row] = await db.select().from(contacts).where(eq(contacts.id, id));
    return row;
  }

  async findByEmail(email: string): Promise<Contact | undefined> {
    const [row] = await db.select().from(contacts).where(eq(contacts.email, email));
    return row;
  }

  async update(id: string, changes: Partial<Omit<Contact, "id">>): Promise<Contact> {
    await db.update(contacts).set(changes).where(eq(contacts.id, id));
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Contact with id "${id}" was not found after update.`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }
}

export const contactRepository = new ContactRepository();

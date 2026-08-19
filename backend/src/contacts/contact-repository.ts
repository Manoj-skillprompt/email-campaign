import { eq, inArray, sql } from "drizzle-orm";
import type { Contact } from "@email-campaign-v2/contracts";

import { db } from "../db/client";
import { contacts } from "../db/schema";

export class ContactRepository {
  async findAll(search?: string): Promise<Contact[]> {
    if (!search) {
      return db
        .select()
        .from(contacts)
        .orderBy(sql`${contacts.createdAt} desc`);
    }

    const term = `%${search.toLowerCase()}%`;
    return db
      .select()
      .from(contacts)
      .where(
        sql`lower(${contacts.name}) like ${term} or lower(${contacts.email}) like ${term} or lower(${contacts.branch}) like ${term}`
      )
      .orderBy(sql`${contacts.createdAt} desc`);
  }

  async findById(id: string): Promise<Contact | undefined> {
    const [row] = await db.select().from(contacts).where(eq(contacts.id, id));
    return row;
  }

  async findByIds(ids: string[]): Promise<Contact[]> {
    if (ids.length === 0) return [];
    return db.select().from(contacts).where(inArray(contacts.id, ids));
  }

  async findByEmail(email: string, excludeId?: string): Promise<Contact | undefined> {
    const [row] = await db
      .select()
      .from(contacts)
      .where(
        excludeId
          ? sql`lower(${contacts.email}) = ${email.toLowerCase()} and ${contacts.id} != ${excludeId}`
          : sql`lower(${contacts.email}) = ${email.toLowerCase()}`
      );
    return row;
  }

  async create(contact: Contact): Promise<Contact> {
    await db.insert(contacts).values(contact);
    return contact;
  }

  async update(id: string, changes: Partial<Omit<Contact, "id">>): Promise<Contact | undefined> {
    await db.update(contacts).set(changes).where(eq(contacts.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }
}

import type { Contact } from "@email-campaign-v2/contracts";
import { eq, sql } from "drizzle-orm";

import { db } from "../db/client";
import { contacts } from "../db/schema";

function toSearchPattern(term: string): string {
  return `%${term.toLowerCase()}%`;
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

    const pattern = toSearchPattern(search);
    return db
      .select()
      .from(contacts)
      .where(
        sql`(lower(${contacts.name}) like ${pattern} or lower(${contacts.email}) like ${pattern} or lower(${contacts.branch}) like ${pattern})`
      );
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

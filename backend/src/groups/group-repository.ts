import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "../db/client";
import { groupContacts, groups } from "../db/schema";

export interface GroupRow {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export class GroupRepository {
  async findAll(search?: string): Promise<GroupRow[]> {
    if (!search) {
      return db
        .select()
        .from(groups)
        .orderBy(sql`${groups.createdAt} desc`);
    }

    const term = `%${search.toLowerCase()}%`;
    return db
      .select()
      .from(groups)
      .where(sql`lower(${groups.name}) like ${term}`)
      .orderBy(sql`${groups.createdAt} desc`);
  }

  async findById(id: string): Promise<GroupRow | undefined> {
    const [row] = await db.select().from(groups).where(eq(groups.id, id));
    return row;
  }

  async findByIds(ids: string[]): Promise<GroupRow[]> {
    if (ids.length === 0) return [];
    return db.select().from(groups).where(inArray(groups.id, ids));
  }

  async findByName(name: string, excludeId?: string): Promise<GroupRow | undefined> {
    const [row] = await db
      .select()
      .from(groups)
      .where(
        excludeId
          ? sql`lower(${groups.name}) = ${name.toLowerCase()} and ${groups.id} != ${excludeId}`
          : sql`lower(${groups.name}) = ${name.toLowerCase()}`
      );
    return row;
  }

  async create(group: GroupRow): Promise<GroupRow> {
    await db.insert(groups).values(group);
    return group;
  }

  async update(id: string, changes: Partial<Omit<GroupRow, "id">>): Promise<GroupRow | undefined> {
    await db.update(groups).set(changes).where(eq(groups.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await db.delete(groupContacts).where(eq(groupContacts.groupId, id));
    await db.delete(groups).where(eq(groups.id, id));
  }

  async addContacts(groupId: string, contactIds: string[]): Promise<void> {
    if (contactIds.length === 0) return;

    const existing = await db
      .select({ contactId: groupContacts.contactId })
      .from(groupContacts)
      .where(and(eq(groupContacts.groupId, groupId), inArray(groupContacts.contactId, contactIds)));
    const existingIds = new Set(existing.map((row) => row.contactId));

    const toInsert = contactIds.filter((contactId) => !existingIds.has(contactId));
    if (toInsert.length === 0) return;

    await db.insert(groupContacts).values(toInsert.map((contactId) => ({ groupId, contactId })));
  }

  async removeContacts(groupId: string, contactIds: string[]): Promise<void> {
    if (contactIds.length === 0) return;

    await db
      .delete(groupContacts)
      .where(and(eq(groupContacts.groupId, groupId), inArray(groupContacts.contactId, contactIds)));
  }

  async countContacts(groupId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(groupContacts)
      .where(eq(groupContacts.groupId, groupId));
    return row?.count ?? 0;
  }

  async findContactIds(groupId: string): Promise<string[]> {
    const rows = await db
      .select({ contactId: groupContacts.contactId })
      .from(groupContacts)
      .where(eq(groupContacts.groupId, groupId));
    return rows.map((row) => row.contactId);
  }

  async findContactIdsForGroups(groupIds: string[]): Promise<string[]> {
    if (groupIds.length === 0) return [];
    const rows = await db
      .select({ contactId: groupContacts.contactId })
      .from(groupContacts)
      .where(inArray(groupContacts.groupId, groupIds));
    return rows.map((row) => row.contactId);
  }
}

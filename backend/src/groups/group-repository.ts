import type { Group } from "@email-campaign-v2/contracts";
import { eq, sql } from "drizzle-orm";

import { db } from "../db/client";
import { groups } from "../db/schema";

type GroupRow = typeof groups.$inferSelect;

function toGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    contactIds: JSON.parse(row.contactIds) as string[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toRow(group: Group): GroupRow {
  return {
    id: group.id,
    name: group.name,
    contactIds: JSON.stringify(group.contactIds),
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

function toSearchPattern(term: string): string {
  return `%${term.toLowerCase()}%`;
}

export class GroupRepository {
  async create(group: Group): Promise<Group> {
    await db.insert(groups).values(toRow(group));
    return group;
  }

  async findAll(search?: string): Promise<Group[]> {
    if (!search) {
      const rows = await db.select().from(groups);
      return rows.map(toGroup);
    }

    const pattern = toSearchPattern(search);
    const rows = await db
      .select()
      .from(groups)
      .where(sql`lower(${groups.name}) like ${pattern}`);
    return rows.map(toGroup);
  }

  async findById(id: string): Promise<Group | undefined> {
    const [row] = await db.select().from(groups).where(eq(groups.id, id));
    return row ? toGroup(row) : undefined;
  }

  async findByName(name: string): Promise<Group | undefined> {
    const [row] = await db.select().from(groups).where(eq(groups.name, name));
    return row ? toGroup(row) : undefined;
  }

  async findByContactId(contactId: string): Promise<Group | undefined> {
    const rows = await db.select().from(groups);
    const match = rows.find((row) => (JSON.parse(row.contactIds) as string[]).includes(contactId));
    return match ? toGroup(match) : undefined;
  }

  async update(id: string, changes: Partial<Omit<Group, "id">>): Promise<Group> {
    const setValues: Partial<GroupRow> = {};
    if (changes.name !== undefined) setValues.name = changes.name;
    if (changes.contactIds !== undefined) setValues.contactIds = JSON.stringify(changes.contactIds);
    if (changes.updatedAt !== undefined) setValues.updatedAt = changes.updatedAt;

    await db.update(groups).set(setValues).where(eq(groups.id, id));
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Group with id "${id}" was not found after update.`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }
}

export const groupRepository = new GroupRepository();

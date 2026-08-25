import type { Campaign, CampaignStatus } from "@email-campaign-v2/contracts";
import { eq, sql } from "drizzle-orm";

import { db } from "../db/client";
import { campaigns } from "../db/schema";

type CampaignRow = typeof campaigns.$inferSelect;

function toCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    senderEmail: row.senderEmail,
    type: "EMAIL",
    groupIds: JSON.parse(row.groupIds) as string[],
    content: row.content,
    status: row.status as CampaignStatus,
    scheduledAt: row.scheduledAt,
    sentAt: row.sentAt,
    sentCount: row.sentCount,
    openRate: row.openRate,
    clickRate: row.clickRate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toRow(campaign: Campaign): CampaignRow {
  return {
    id: campaign.id,
    name: campaign.name,
    subject: campaign.subject,
    senderEmail: campaign.senderEmail,
    type: campaign.type,
    groupIds: JSON.stringify(campaign.groupIds),
    content: campaign.content,
    status: campaign.status,
    scheduledAt: campaign.scheduledAt,
    sentAt: campaign.sentAt,
    sentCount: campaign.sentCount,
    openRate: campaign.openRate,
    clickRate: campaign.clickRate,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  };
}

function toSearchPattern(term: string): string {
  return `%${term.toLowerCase()}%`;
}

export class CampaignRepository {
  async create(campaign: Campaign): Promise<Campaign> {
    await db.insert(campaigns).values(toRow(campaign));
    return campaign;
  }

  async findAll(search?: string, status?: CampaignStatus): Promise<Campaign[]> {
    const conditions = [];
    if (search) {
      conditions.push(sql`lower(${campaigns.name}) like ${toSearchPattern(search)}`);
    }
    if (status) {
      conditions.push(eq(campaigns.status, status));
    }

    if (conditions.length === 0) {
      const rows = await db.select().from(campaigns);
      return rows.map(toCampaign);
    }

    const rows = await db
      .select()
      .from(campaigns)
      .where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} and ${conditions[1]}`);
    return rows.map(toCampaign);
  }

  async findById(id: string): Promise<Campaign | undefined> {
    const [row] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return row ? toCampaign(row) : undefined;
  }

  async update(id: string, changes: Partial<Omit<Campaign, "id">>): Promise<Campaign> {
    const setValues: Partial<CampaignRow> = {};
    if (changes.name !== undefined) setValues.name = changes.name;
    if (changes.subject !== undefined) setValues.subject = changes.subject;
    if (changes.senderEmail !== undefined) setValues.senderEmail = changes.senderEmail;
    if (changes.groupIds !== undefined) setValues.groupIds = JSON.stringify(changes.groupIds);
    if (changes.content !== undefined) setValues.content = changes.content;
    if (changes.status !== undefined) setValues.status = changes.status;
    if (changes.scheduledAt !== undefined) setValues.scheduledAt = changes.scheduledAt;
    if (changes.sentAt !== undefined) setValues.sentAt = changes.sentAt;
    if (changes.sentCount !== undefined) setValues.sentCount = changes.sentCount;
    if (changes.openRate !== undefined) setValues.openRate = changes.openRate;
    if (changes.clickRate !== undefined) setValues.clickRate = changes.clickRate;
    if (changes.updatedAt !== undefined) setValues.updatedAt = changes.updatedAt;

    await db.update(campaigns).set(setValues).where(eq(campaigns.id, id));
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Campaign with id "${id}" was not found after update.`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }
}

export const campaignRepository = new CampaignRepository();

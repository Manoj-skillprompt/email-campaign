import type { CampaignStatus } from "@email-campaign-v2/contracts";
import { and, eq, sql } from "drizzle-orm";

import { db } from "../db/client";
import { campaignTargetGroups, campaigns } from "../db/schema";

export interface CampaignRow {
  id: string;
  name: string;
  subject: string;
  sender: string;
  body: string;
  status: CampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class CampaignRepository {
  async findAll(status?: CampaignStatus, search?: string): Promise<CampaignRow[]> {
    const conditions = [];
    if (status) {
      conditions.push(eq(campaigns.status, status));
    }
    if (search) {
      conditions.push(sql`lower(${campaigns.name}) like ${`%${search.toLowerCase()}%`}`);
    }

    const rows = await db
      .select()
      .from(campaigns)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${campaigns.createdAt} desc`);
    return rows as CampaignRow[];
  }

  async findById(id: string): Promise<CampaignRow | undefined> {
    const [row] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return row as CampaignRow | undefined;
  }

  async create(campaign: CampaignRow): Promise<CampaignRow> {
    await db.insert(campaigns).values(campaign);
    return campaign;
  }

  async update(id: string, changes: Partial<Omit<CampaignRow, "id">>): Promise<CampaignRow | undefined> {
    await db.update(campaigns).set(changes).where(eq(campaigns.id, id));
    return this.findById(id);
  }

  async findTargetGroupIds(campaignId: string): Promise<string[]> {
    const rows = await db
      .select({ groupId: campaignTargetGroups.groupId })
      .from(campaignTargetGroups)
      .where(eq(campaignTargetGroups.campaignId, campaignId));
    return rows.map((row) => row.groupId);
  }

  async setTargetGroups(campaignId: string, groupIds: string[]): Promise<void> {
    await db.delete(campaignTargetGroups).where(eq(campaignTargetGroups.campaignId, campaignId));
    if (groupIds.length === 0) return;
    await db.insert(campaignTargetGroups).values(groupIds.map((groupId) => ({ campaignId, groupId })));
  }
}

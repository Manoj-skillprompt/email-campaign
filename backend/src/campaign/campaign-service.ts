import type { Campaign, CreateCampaignInput, UpdateCampaignInput } from "@email-campaign-v2/contracts";
import { randomUUID } from "node:crypto";

import { contactService, type ContactService } from "../contacts/contact-service";
import { GroupNotFoundError } from "../groups/group-errors";
import { groupService, type GroupService } from "../groups/group-service";
import { CampaignAlreadySentError, CampaignNotFoundError, CampaignValidationError } from "./campaign-errors";
import { campaignRepository, type CampaignRepository } from "./campaign-repository";
import { sesEmailSender, type EmailSender } from "./email-sender";

function isFullyValid(campaign: Campaign): boolean {
  return (
    campaign.name.trim().length > 0 &&
    campaign.subject.trim().length > 0 &&
    campaign.senderEmail.trim().length > 0 &&
    campaign.groupIds.length > 0
  );
}

export class CampaignService {
  constructor(
    private readonly repository: CampaignRepository = campaignRepository,
    private readonly groups: GroupService = groupService,
    private readonly contacts: ContactService = contactService,
    private readonly emailSender: EmailSender = sesEmailSender
  ) {}

  async createCampaign(input: CreateCampaignInput): Promise<Campaign> {
    const now = new Date().toISOString();
    const campaign: Campaign = {
      id: randomUUID(),
      name: input.name,
      subject: input.subject ?? "",
      senderEmail: input.senderEmail ?? "",
      type: "EMAIL",
      groupIds: input.groupIds ?? [],
      content: input.content ?? "",
      status: "DRAFT",
      scheduledAt: null,
      sentAt: null,
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.create(campaign);
  }

  async listCampaigns(search?: string, status?: Campaign["status"]): Promise<Campaign[]> {
    return this.repository.findAll(search, status);
  }

  private async requireEditable(id: string): Promise<Campaign> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new CampaignNotFoundError(id);
    }
    if (existing.status === "SENT") {
      throw new CampaignAlreadySentError(id);
    }
    return existing;
  }

  async updateCampaign(id: string, input: UpdateCampaignInput): Promise<Campaign> {
    await this.requireEditable(id);
    return this.repository.update(id, { ...input, updatedAt: new Date().toISOString() });
  }

  async scheduleCampaign(id: string, scheduledAt: string): Promise<Campaign> {
    const existing = await this.requireEditable(id);
    if (!isFullyValid(existing)) {
      throw new CampaignValidationError();
    }

    return this.repository.update(id, {
      status: "SCHEDULED",
      scheduledAt,
      updatedAt: new Date().toISOString(),
    });
  }

  async sendCampaignNow(id: string): Promise<Campaign> {
    const existing = await this.requireEditable(id);
    if (!isFullyValid(existing)) {
      throw new CampaignValidationError();
    }

    const contactIds = new Set<string>();
    for (const groupId of existing.groupIds) {
      const group = await this.groups.getGroupById(groupId);
      if (!group) {
        throw new GroupNotFoundError(groupId);
      }
      for (const contactId of group.contactIds) {
        contactIds.add(contactId);
      }
    }

    let sentCount = 0;
    for (const contactId of contactIds) {
      const contact = await this.contacts.getContactById(contactId);
      if (!contact) {
        continue;
      }
      await this.emailSender.sendEmail({
        to: contact.email,
        subject: existing.subject,
        body: existing.content,
        from: existing.senderEmail,
      });
      sentCount += 1;
    }

    const now = new Date().toISOString();
    return this.repository.update(id, { status: "SENT", sentAt: now, sentCount, updatedAt: now });
  }

  async deleteCampaign(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new CampaignNotFoundError(id);
    }
    await this.repository.delete(id);
  }
}

export const campaignService = new CampaignService();

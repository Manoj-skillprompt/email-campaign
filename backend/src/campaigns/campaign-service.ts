import { randomUUID } from "node:crypto";

import type {
  Campaign,
  CampaignStatus,
  CreateCampaignInput,
  ScheduleCampaignInput,
  UpdateCampaignInput,
} from "@email-campaign-v2/contracts";

import { ContactRepository } from "../contacts/contact-repository";
import { GroupRepository } from "../groups/group-repository";
import { ConflictError, NotFoundError, ValidationError } from "./campaign-errors";
import { CampaignRepository, type CampaignRow } from "./campaign-repository";
import { createEmailSender, type EmailSender } from "./email-sender";

const NAME_PLACEHOLDER = /\{\{name\}\}/g;

export class CampaignService {
  constructor(
    private readonly campaignRepository: CampaignRepository = new CampaignRepository(),
    private readonly groupRepository: GroupRepository = new GroupRepository(),
    private readonly contactRepository: ContactRepository = new ContactRepository(),
    private readonly emailSender: EmailSender = createEmailSender()
  ) {}

  async getCampaigns(status?: CampaignStatus, search?: string): Promise<Campaign[]> {
    const rows = await this.campaignRepository.findAll(status, search);
    return Promise.all(rows.map((row) => this.toCampaign(row)));
  }

  async getCampaignById(id: string): Promise<Campaign> {
    const row = await this.campaignRepository.findById(id);
    if (!row) {
      throw new NotFoundError(`Campaign "${id}" was not found`);
    }
    return this.toCampaign(row);
  }

  async createCampaign(input: CreateCampaignInput): Promise<Campaign> {
    const targetGroupIds = [...new Set(input.targetGroupIds)];
    if (targetGroupIds.length === 0) {
      throw new ValidationError("At least one target group is required");
    }
    await this.assertGroupsExist(targetGroupIds);

    const sender = input.sender ?? process.env.SES_FROM_EMAIL;
    if (!sender) {
      throw new ValidationError(
        "Sender email is required: provide it explicitly or configure the SES_FROM_EMAIL environment variable"
      );
    }

    const now = new Date().toISOString();
    const row: CampaignRow = {
      id: randomUUID(),
      name: input.name,
      subject: input.subject,
      sender,
      body: input.body,
      status: "Draft",
      scheduledAt: null,
      sentAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.campaignRepository.create(row);
    await this.campaignRepository.setTargetGroups(row.id, targetGroupIds);

    return this.toCampaign(row);
  }

  async updateCampaign(id: string, input: UpdateCampaignInput): Promise<Campaign> {
    const existing = await this.campaignRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Campaign "${id}" was not found`);
    }
    if (existing.status !== "Draft") {
      throw new ConflictError(`Campaign "${id}" cannot be edited because its status is "${existing.status}"`);
    }

    let targetGroupIds: string[] | undefined;
    if (input.targetGroupIds) {
      targetGroupIds = [...new Set(input.targetGroupIds)];
      await this.assertGroupsExist(targetGroupIds);
    }

    const updated = await this.campaignRepository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.sender !== undefined ? { sender: input.sender } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      updatedAt: new Date().toISOString(),
    });
    if (!updated) {
      throw new NotFoundError(`Campaign "${id}" was not found`);
    }

    if (targetGroupIds) {
      await this.campaignRepository.setTargetGroups(id, targetGroupIds);
    }

    return this.toCampaign(updated);
  }

  async scheduleCampaign(id: string, input: ScheduleCampaignInput): Promise<Campaign> {
    const existing = await this.campaignRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Campaign "${id}" was not found`);
    }
    if (existing.status !== "Draft") {
      throw new ConflictError(`Campaign "${id}" cannot be scheduled because its status is "${existing.status}"`);
    }

    const scheduledDate = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      throw new ValidationError(`"${input.scheduledAt}" is not a valid timestamp`);
    }
    if (scheduledDate.getTime() <= Date.now()) {
      throw new ValidationError("scheduledAt must be in the future");
    }

    const updated = await this.campaignRepository.update(id, {
      status: "Scheduled",
      scheduledAt: input.scheduledAt,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) {
      throw new NotFoundError(`Campaign "${id}" was not found`);
    }

    return this.toCampaign(updated);
  }

  async sendNow(id: string): Promise<Campaign> {
    const existing = await this.campaignRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Campaign "${id}" was not found`);
    }
    if (existing.status !== "Draft" && existing.status !== "Scheduled") {
      throw new ConflictError(`Campaign "${id}" cannot be sent because its status is "${existing.status}"`);
    }

    const processed = await this.processCampaign(existing);
    return this.toCampaign(processed);
  }

  async duplicateCampaign(id: string): Promise<Campaign> {
    const existing = await this.campaignRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Campaign "${id}" was not found`);
    }
    const targetGroupIds = await this.campaignRepository.findTargetGroupIds(id);

    const now = new Date().toISOString();
    const row: CampaignRow = {
      id: randomUUID(),
      name: existing.name,
      subject: existing.subject,
      sender: existing.sender,
      body: existing.body,
      status: "Draft",
      scheduledAt: null,
      sentAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.campaignRepository.create(row);
    await this.campaignRepository.setTargetGroups(row.id, targetGroupIds);

    return this.toCampaign(row);
  }

  async processDueScheduledCampaigns(now: Date = new Date()): Promise<void> {
    const scheduled = await this.campaignRepository.findAll("Scheduled");
    const due = scheduled.filter((row) => row.scheduledAt && new Date(row.scheduledAt) <= now);
    for (const row of due) {
      await this.processCampaign(row);
    }
  }

  private async processCampaign(campaign: CampaignRow): Promise<CampaignRow> {
    await this.campaignRepository.update(campaign.id, {
      status: "Sending",
      updatedAt: new Date().toISOString(),
    });

    const targetGroupIds = await this.campaignRepository.findTargetGroupIds(campaign.id);
    const recipients = await this.resolveRecipients(targetGroupIds);

    if (recipients.length === 0) {
      const failed = await this.campaignRepository.update(campaign.id, {
        status: "Failed",
        updatedAt: new Date().toISOString(),
      });
      return failed ?? campaign;
    }

    let allDispatchesSucceeded = true;
    for (const recipient of recipients) {
      try {
        await this.emailSender.send({
          from: campaign.sender,
          to: recipient.email,
          subject: campaign.subject,
          body: this.substitutePlaceholders(campaign.body, recipient.name),
        });
      } catch {
        allDispatchesSucceeded = false;
      }
    }

    const finishedAt = new Date().toISOString();
    const finished = await this.campaignRepository.update(
      campaign.id,
      allDispatchesSucceeded
        ? { status: "Sent", sentAt: finishedAt, updatedAt: finishedAt }
        : { status: "Failed", updatedAt: finishedAt }
    );
    return finished ?? campaign;
  }

  private substitutePlaceholders(body: string, recipientName: string): string {
    return body.replace(NAME_PLACEHOLDER, recipientName);
  }

  private async resolveRecipients(targetGroupIds: string[]) {
    const contactIds = [...new Set(await this.groupRepository.findContactIdsForGroups(targetGroupIds))];
    if (contactIds.length === 0) return [];
    return this.contactRepository.findByIds(contactIds);
  }

  private async assertGroupsExist(groupIds: string[]): Promise<void> {
    const found = await this.groupRepository.findByIds(groupIds);
    const foundIds = new Set(found.map((group) => group.id));
    const missing = groupIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new ValidationError(`Unknown target group id(s): ${missing.join(", ")}`);
    }
  }

  private async toCampaign(row: CampaignRow): Promise<Campaign> {
    const targetGroupIds = await this.campaignRepository.findTargetGroupIds(row.id);
    return { ...row, targetGroupIds };
  }
}

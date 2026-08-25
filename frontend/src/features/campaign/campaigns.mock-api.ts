import type { Campaign, CampaignStatus, CreateCampaignInput, UpdateCampaignInput } from "./campaign.types";
import { initialMockCampaigns } from "./campaigns.mock-data";

export class CampaignNotFoundError extends Error {
  constructor(id: string) {
    super(`Campaign with id "${id}" was not found.`);
    this.name = "CampaignNotFoundError";
  }
}

export class CampaignAlreadySentError extends Error {
  constructor(id: string) {
    super(`Campaign with id "${id}" has already been sent and can no longer be modified.`);
    this.name = "CampaignAlreadySentError";
  }
}

export class CampaignValidationError extends Error {
  constructor() {
    super("Campaign must have a name, subject, sender, and at least one group before it can be scheduled or sent.");
    this.name = "CampaignValidationError";
  }
}

let mockCampaigns: Campaign[] = [...initialMockCampaigns];

const MOCK_LATENCY_MS = 150;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

function matchesSearch(campaign: Campaign, search: string): boolean {
  return campaign.name.toLowerCase().includes(search.toLowerCase());
}

function isFullyValid(campaign: Campaign): boolean {
  return (
    campaign.name.trim().length > 0 &&
    campaign.subject.trim().length > 0 &&
    campaign.senderEmail.trim().length > 0 &&
    campaign.groupIds.length > 0
  );
}

function findCampaign(id: string): Campaign {
  const campaign = mockCampaigns.find((item) => item.id === id);
  if (!campaign) {
    throw new CampaignNotFoundError(id);
  }
  return campaign;
}

export async function listCampaigns(params?: { search?: string; status?: CampaignStatus }): Promise<Campaign[]> {
  let results = mockCampaigns;
  if (params?.status) {
    results = results.filter((campaign) => campaign.status === params.status);
  }
  const search = params?.search?.trim();
  if (search) {
    results = results.filter((campaign) => matchesSearch(campaign, search));
  }
  return delay([...results]);
}

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const now = new Date().toISOString();
  const campaign: Campaign = {
    id: crypto.randomUUID(),
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
  mockCampaigns = [campaign, ...mockCampaigns];
  return delay(campaign);
}

export async function updateCampaign(id: string, input: UpdateCampaignInput): Promise<Campaign> {
  const existing = findCampaign(id);
  if (existing.status === "SENT") {
    throw new CampaignAlreadySentError(id);
  }
  const updated: Campaign = { ...existing, ...input, updatedAt: new Date().toISOString() };
  mockCampaigns = mockCampaigns.map((campaign) => (campaign.id === id ? updated : campaign));
  return delay(updated);
}

export async function scheduleCampaign(id: string, scheduledAt: string): Promise<Campaign> {
  const existing = findCampaign(id);
  if (existing.status === "SENT") {
    throw new CampaignAlreadySentError(id);
  }
  if (!isFullyValid(existing)) {
    throw new CampaignValidationError();
  }
  const updated: Campaign = { ...existing, status: "SCHEDULED", scheduledAt, updatedAt: new Date().toISOString() };
  mockCampaigns = mockCampaigns.map((campaign) => (campaign.id === id ? updated : campaign));
  return delay(updated);
}

export async function sendCampaignNow(id: string): Promise<Campaign> {
  const existing = findCampaign(id);
  if (existing.status === "SENT") {
    throw new CampaignAlreadySentError(id);
  }
  if (!isFullyValid(existing)) {
    throw new CampaignValidationError();
  }
  const now = new Date().toISOString();
  const updated: Campaign = {
    ...existing,
    status: "SENT",
    sentAt: now,
    sentCount: existing.groupIds.length,
    updatedAt: now,
  };
  mockCampaigns = mockCampaigns.map((campaign) => (campaign.id === id ? updated : campaign));
  return delay(updated);
}

export async function deleteCampaign(id: string): Promise<void> {
  findCampaign(id);
  mockCampaigns = mockCampaigns.filter((campaign) => campaign.id !== id);
  return delay(undefined);
}

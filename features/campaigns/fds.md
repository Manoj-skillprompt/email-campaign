---
id: campaigns
title: Campaigns Management
status: active
version: 1.0.0
owner: campaign-team
last_updated: 2026-08-20
coverage_target: 80
compliance_relevant: false
dependencies:
  - contacts
  - groups
changelog:
  - version: 1.0.0
    date: 2026-08-20
    pr: "#003"
    summary: Initial specification for Campaigns management with AWS SES email delivery
---

# Feature Specification: Campaigns Management

## 1. Overview

Provide capability to create, schedule, send, view, and duplicate personalized email campaigns targeting contact groups, with delivery powered by Amazon Simple Email Service (AWS SES) via the AWS SDK.

## 2. Dependencies

- `contacts` (Minimum version: 1.0.0)
- `groups` (Minimum version: 1.0.0)

## 3. Visual & UI Specification

- Authoritative Figma Frames: [`features/campaigns/visuals/figma.md`](features/campaigns/visuals/figma.md)

## 4. Data Model (`Campaign`)

- `id`: string (UUID, Primary Key)
- `name`: string (Required, non-empty)
- `subject`: string (Required, non-empty)
- `sender`: string (Required email, default from environment config)
- `body`: string (Required HTML/text body)
- `targetGroupIds`: string[] (Array of Group UUIDs, minimum 1)
- `status`: Enum (`Draft`, `Scheduled`, `Sending`, `Sent`, `Failed`, `Cancelled`)
- `scheduledAt`: string | null (ISO Timestamp)
- `sentAt`: string | null (ISO Timestamp)
- `createdAt`: string (ISO Timestamp)
- `updatedAt`: string (ISO Timestamp)

## 5. Functional Requirements

### REQ-CMP-01: Create Campaign & Initial Template

- Requires `name`, `subject`, `body`, and at least one target group.
- Initialized email body text MUST default to:

  ```text
  Hi {{name}},

  Write your email here...

  Best,
  The Team
  ```

### REQ-CMP-02: Save Draft

- Saves campaign with `Draft` status. Draft campaigns remain editable.

### REQ-CMP-03: Live Recipient Resolution & Deduplication

- Recipients are resolved using **live group membership** at the moment execution starts.
- If a contact belongs to multiple targeted groups, only **one email is sent** (deduplication).
- If resolved recipient list is empty, campaign cannot be sent.

### REQ-CMP-04: Placeholder Substitution

- Supports `{{name}}` placeholder substitution per recipient contact.
- Unknown placeholders (e.g. `{{unknown}}`) remain unchanged.

### REQ-CMP-05: Send Immediately & Schedule Campaign

- **Send Immediately**: Transition status `Draft -> Sending -> Sent / Failed`.
  - Dispatches personalized emails to all resolved recipient contacts via AWS SES (`@aws-sdk/client-ses`).
- **Schedule Campaign**: Stores future `scheduledAt` date/time. Transition `Draft -> Scheduled`. Processing starts automatically when scheduled time is reached.

### REQ-CMP-06: Duplicate Campaign

- Duplicating an existing campaign creates a NEW campaign with `Draft` status.
- Copies Subject, Body, and Target Groups. Does NOT copy send history or `scheduledAt`/`sentAt` timestamps.

### REQ-CMP-07: Immutability Rules

- Only `Draft` campaigns can be edited. `Sent`, `Sending`, and `Cancelled` campaigns are immutable.

## 6. Email Delivery & AWS SES Integration

- **Provider**: Amazon SES via AWS SDK v3 (`@aws-sdk/client-ses`).
- **Sender Address**: Configurable via environment variable (e.g. `SES_FROM_EMAIL` or `SENDER_EMAIL`).
- **Development & Testing Mode**: In local/test environments or when AWS credentials are not configured/mocked, provide an email service adapter or mock client that records sent email payloads without throwing AWS authentication errors.

## 7. Validation Rules

- Required fields: Name, Subject, Body, and at least one Target Group (`targetGroupIds.length >= 1`).
- `sender` must be a valid email format.
- Only `Draft` status campaigns can be updated or scheduled.

## 8. API / Interface Specification

- `createCampaign(data: CreateCampaignInput): Promise<Campaign>`
- `getCampaigns(query?: { status?: string; search?: string }): Promise<Campaign[]>`
- `getCampaignById(id: string): Promise<Campaign>`
- `updateCampaign(id: string, data: Partial<CreateCampaignInput>): Promise<Campaign>`
- `sendNow(id: string): Promise<Campaign>`
- `scheduleCampaign(id: string, data: { scheduledAt: string }): Promise<Campaign>`
- `duplicateCampaign(id: string): Promise<Campaign>`

---
id: campaign
title: Campaigns Management
status: active
version: 1.0.0
owner: campaigns-team
last_updated: 2026-08-25
coverage_target: 80
compliance_relevant: false
dependencies:
  - feature: contacts
    minVersion: 1.0.0
  - feature: groups
    minVersion: 1.0.0
changelog:
  - version: 1.0.0
    date: 2026-08-25
    summary: Initial specification for Campaigns management, derived from Figma design
---

# Feature Specification: Campaigns Management

## 1. Overview

Provide capability to compose, schedule, and send email campaigns to one or more audience Groups, and to track their delivery/engagement metrics.

## 2. Data Model (`Campaign`)

- `id`: string (UUID, Primary Key)
- `name`: string (Required, non-empty)
- `subject`: string (Required, non-empty)
- `senderEmail`: string (Required, valid email; selected from a configured list of senders)
- `type`: enum (`EMAIL`) (fixed for v1; design shows only Email badges)
- `groupIds`: string[] (Foreign Key → `Group.id`; the audience — at least one group required to send)
- `content`: string (rich text/HTML body, from the Rich Text Editor)
- `status`: enum (`DRAFT`, `SCHEDULED`, `SENT`)
- `scheduledAt`: string | null (ISO Timestamp; set when `status = SCHEDULED`)
- `sentAt`: string | null (ISO Timestamp; set when `status = SENT`)
- `sentCount`: number (derived; total recipients sent)
- `openRate`: number (derived; percentage)
- `clickRate`: number (derived; percentage)
- `createdAt`: string (ISO Timestamp)
- `updatedAt`: string (ISO Timestamp)

## 3. Functional Requirements

### REQ-CAM-01: Create Campaign

- Selecting **+ New Campaign** opens the campaign composer modal with:
  - `Name` and `Subject` text inputs.
  - `Sender` dropdown (e.g. "Skillprompt <info@skillprompt.com>").
  - `Groups` multi-select (audience), shown as removable badges, plus "+ Browse Media" and "+ Personalize" affordances for the body.
  - A rich text editor toolbar (bold, italic, alignment, link, image, list) and content area for the email body.
  - A live **Preview** pane on the right reflecting Subject and body content.
- Must validate `name`, `subject`, `senderEmail`, and at least one `groupIds` entry before Send/Schedule.

### REQ-CAM-02: Save Draft

- Selecting **Save draft** persists the campaign with `status = DRAFT` regardless of validation completeness, closes or keeps the modal open per UX, and refreshes the campaign list.

### REQ-CAM-03: Schedule Campaign

- Selecting **Schedule for later** prompts for a future date/time, then sets `status = SCHEDULED` and `scheduledAt` to the chosen time. Requires full validation to pass.

### REQ-CAM-04: Send Campaign Now

- Selecting **Send now** immediately sets `status = SENT` and `sentAt` to the current time, dispatching to all resolved contacts across `groupIds`. Requires full validation to pass.

### REQ-CAM-05: Delete Campaign

- Selecting **Trash** in the composer (or an equivalent list action) permanently deletes the campaign after confirmation.

### REQ-CAM-06: View & List Campaigns

- Displays campaigns in a tabbed, tabular view. Tabs: **All**, **Drafts**, **Scheduled**, **Sent** — each filters the table by `status` (Drafts → DRAFT, Scheduled → SCHEDULED, Sent → SENT).
- Table columns: Campaign (name), Type, Audience (group name(s)), Status (badge), Sent (count), Open Rate, Click Rate, Date.
- Each row is selectable via a checkbox (for bulk actions).

### REQ-CAM-07: Search Campaigns

- Supports case-insensitive searching by campaign name, updating the table dynamically without navigation.

## 4. Validation Rules

- Required fields for Send/Schedule: `name`, `subject`, `senderEmail`, `groupIds` (min 1).
- `Save draft` bypasses full validation but still requires a non-empty `name`.
- `senderEmail` must be one of the configured/verified sender addresses.

## 5. API / Interface Specification

- `createCampaign(data: { name: string; subject: string; senderEmail: string; groupIds: string[]; content: string }): Promise<Campaign>`
- `getCampaigns(query?: { search?: string; status?: 'DRAFT' | 'SCHEDULED' | 'SENT' }): Promise<Campaign[]>`
- `updateCampaign(id: string, data: Partial<CreateCampaignInput>): Promise<Campaign>`
- `scheduleCampaign(id: string, scheduledAt: string): Promise<Campaign>`
- `sendCampaignNow(id: string): Promise<Campaign>`
- `deleteCampaign(id: string): Promise<void>`

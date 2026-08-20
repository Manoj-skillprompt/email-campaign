# Presentation Contract: Campaigns Management

- **Feature ID**: campaigns
- **Generated**: Frontend Build Mode (Phase 3), pending UI Review & Freeze (Phase 4)
- **Status**: Draft — becomes authoritative for Backend Build Mode once frozen

This document records the mock data shapes and component-level request/response contracts
implemented against `features/campaigns/fds.md` and `features/campaigns/behavior.md` using mock
data. Once frozen, Backend Build Mode (Phase 5) must satisfy these shapes exactly via the
`packages/contracts` ts-rest contract (plan tasks B1–B4).

---

## 1. Data Shape — `Campaign`

Matches FDS §4 exactly. Implemented at `frontend/src/types/campaign.ts` (local mock-phase type;
will be replaced by a re-export from `@email-campaign-v2/contracts` once `campaignsContract`
exists — plan task I-equivalent of Groups' I7, not yet numbered in plan.md but required for
consistency with `frontend/src/types/group.ts`).

| Field            | Type                  | Notes                                           |
| :--------------- | :-------------------- | :---------------------------------------------- |
| `id`             | `string`              | UUID, primary key                               |
| `name`           | `string`              | Required, non-empty                             |
| `subject`        | `string`              | Required, non-empty                             |
| `sender`         | `string`              | Required, valid email                           |
| `body`           | `string`              | Required                                        |
| `targetGroupIds` | `string[]`            | Minimum 1                                       |
| `status`         | `CampaignStatus` enum | `Draft/Scheduled/Sending/Sent/Failed/Cancelled` |
| `scheduledAt`    | `string \| null`      | ISO 8601 timestamp                              |
| `sentAt`         | `string \| null`      | ISO 8601 timestamp                              |
| `createdAt`      | `string`              | ISO 8601 timestamp                              |
| `updatedAt`      | `string`              | ISO 8601 timestamp                              |

A companion mock-only type, `CampaignTargetGroup` (`frontend/src/types/campaign-target-group.ts`,
`{ id, name, contactIds }`), stands in for the real Groups feature during the mock phase — see §3.

## 2. Request Shapes

- `CreateCampaignInput`: `{ name, subject, sender, body, targetGroupIds }` (FDS §8)
- `UpdateCampaignInput`: `Partial<CreateCampaignInput>` (FDS §8)

The frontend form (`CampaignEditorModal`) collects `CampaignFormValues`
(`frontend/src/lib/validation/campaign-schema.ts`, Zod):

- `name`, `subject`, `body`: required, trimmed, min length 1.
- `sender`: required, valid email format (FDS §7).
- `targetGroupIds`: `string[]`, minimum 1 (FDS §7).

## 3. Mock Data Source

`frontend/src/lib/campaign-mock-data.ts` exports:

- `DEFAULT_CAMPAIGN_BODY`: the required default body template (FDS §5, REQ-CMP-01).
- `MOCK_TARGET_GROUPS`: 3 seed `CampaignTargetGroup` records (`id`, `name`, `contactIds`),
  self-contained for the campaigns feature — not read from the real Groups feature/API. One
  contact id (`ct-1`, `ct-3`) intentionally appears in more than one group to exercise recipient
  deduplication (REQ-CMP-03) in `SendNowDialog`'s preview.
- `MOCK_CAMPAIGNS`: 4 seed `Campaign` records covering `Draft`, `Scheduled`, and `Sent` statuses.

`frontend/src/app/campaigns/page.tsx` holds `MOCK_CAMPAIGNS` in local component state and performs
create/update/schedule/send/duplicate against this state in memory. Integration Build Mode (Phase
6, plan tasks I1–I8) replaces this with TanStack Query + ts-rest client calls, and replaces
`MOCK_TARGET_GROUPS` with the real Groups feature's `getGroups` client (plan task I8).

`frontend/src/lib/campaign-recipients.ts` exports `resolveRecipientCount(targetGroupIds,
targetGroups)`, computing the deduplicated recipient count client-side against
`MOCK_TARGET_GROUPS` (plan.md §3 clarification 7) — Integration Build Mode (I6) swaps the data
source to a live `getGroups` read without changing this function's signature.

## 4. Component Contracts

### `CampaignStatusTabs`

- **Props**: `{ value: CampaignStatusTab; onChange: (tab) => void }` where `CampaignStatusTab` is
  `'All' | 'Drafts' | 'Scheduled' | 'Sent'` (behavior.md §"View Campaigns").
- **Behavior**: `Sending`/`Failed`/`Cancelled` campaigns have no dedicated tab and remain visible
  only under `All` or via search (plan.md §3 clarification 6).

### `CampaignSearch`

- **Props**: `{ value: string; onChange: (value: string) => void }`
- **Behavior**: Controlled text input; parent filters `campaigns` client-side, case-insensitively
  by `name`, on every keystroke (no navigation).

### `CampaignTable`

- **Props**: `{ campaigns: Campaign[]; targetGroups: CampaignTargetGroup[]; onOpen: (campaign) => void; onDuplicate: (campaign) => void }`
- **Renders**: Campaign Name, resolved Target Group names, status badge, and last-updated date per
  row (behavior.md §"View Campaigns" — Name, Status, Target Groups). Row click opens the editor
  (if `Draft`) or the read-only detail view (otherwise) — see §5 for scope exclusions on the
  additional analytics-style columns shown in the Figma mock.
- Row-level "more options" menu exposes only "Duplicate" — no delete affordance, matching FDS
  (no delete/remove capability is specified for Campaigns in v1.0.0).

### `CampaignsEmptyState`

- **Props**: `{ onCreateCampaign: () => void }`
- **Shown when**: the filtered campaign list is empty (no search/tab matches, or none exist).

### `CampaignEditorModal`

- **Props**: `{ open, onOpenChange, mode: 'create' | 'edit', campaign?: Campaign, targetGroups: CampaignTargetGroup[], onSaveDraft: (values) => Promise<void>, onRequestSchedule: (values) => void, onRequestSendNow: (values) => void }`
- **Behavior**: Name/Subject/Sender/Body fields plus a searchable-free checkbox target-group
  multi-select; new campaigns prefill Body with `DEFAULT_CAMPAIGN_BODY` (REQ-CMP-01). "Save draft"
  validates then calls `onSaveDraft` and closes (REQ-CMP-02). "Schedule for later" and "Send now"
  validate then hand the validated values up to the page, which owns `ScheduleCampaignDialog` /
  `SendNowDialog` (kept as siblings, not nested, so the recipient-count preview and date picker can
  be reused independently of the editor). When `campaign` is present and its status is not `Draft`,
  all fields render `disabled` and the Schedule/Send Now/Save Draft actions are hidden, leaving only
  "Close" (REQ-CMP-07).
- A live preview pane (Subject + Body, unsubstituted) is shown alongside the form, matching the
  Figma reference; placeholder substitution itself is backend-owned (Architecture §"Backend
  Responsibilities") and intentionally not reproduced client-side.

### `ScheduleCampaignDialog`

- **Props**: `{ open, campaignName, onOpenChange, onConfirm: (scheduledAt: string) => void }`
- **Behavior**: Native `<input type="datetime-local">` (no new date-picker dependency, per
  plan.md §3 clarification 10). Confirm is blocked with an inline error if no value is chosen or
  the chosen time is not in the future (FDS §7).

### `SendNowDialog`

- **Props**: `{ open, campaignName, targetGroupIds, targetGroups, onOpenChange, onConfirm: () => void }`
- **Behavior**: Displays the campaign name and the deduplicated recipient count via
  `resolveRecipientCount` (REQ-CMP-03). Confirm is disabled when the resolved count is 0
  (REQ-CMP-03: "If resolved recipient list is empty, campaign cannot be sent").

### `CampaignDetailView`

- **Props**: `{ campaign: Campaign | null; targetGroups: CampaignTargetGroup[]; onOpenChange }`
- **Behavior**: Read-only. Shows status, sender, target group names, `scheduledAt`/`sentAt`
  timestamps, and the body (behavior.md §"View Campaign Details").

### Toast notifications (`useToast`)

- Reuses the existing shared `useToast` provider — no new notification component was introduced
  (plan task F16). Surfaced on Save Draft, Schedule, Send Now, and Duplicate.

## 5. Scope Exclusions (Figma vs. FDS conflict — resolved during Build Mode)

Pulling the actual Figma design context for both referenced frames during Build Mode (rather than
relying on the plan's pre-Build assumptions) surfaced the following, resolved per plan.md §3's own
instruction that Frontend Build Mode must confirm structure against the real pulled content:

- **Route vs. modal (plan.md §3 clarification 9)**: the Figma "Create Campaign" frame (`25:65`) is
  an **overlay/modal**, not a separate page, contradicting the plan's tentative
  `/campaigns/new`/`/campaigns/[id]` route assumption. Resolved as a modal
  (`CampaignEditorModal`), consistent with the Groups feature's established single-modal pattern
  and with `rules/conventions.md`'s "follow existing project patterns before introducing new
  ones."
- **Analytics-style list columns**: the pulled "Campaigns Dashboard" frame (`22:65`) shows `TYPE`
  (always "EMAIL"), `SENT`, `OPEN RATE`, and `CLICK RATE` columns, and row checkboxes. None of
  these exist in the `Campaign` data model (FDS §4) or are mentioned in `behavior.md`; plan task F3
  itself scopes the list to "Name, Status, and Target Groups." Fabricating open/click/sent-count
  data not backed by any FDS field or requirement would violate `rules/conventions.md` ("avoid
  unnecessary abstractions") and the plan's own instruction to resolve ambiguity "without inventing
  unstated business rules." These columns and the row checkboxes (no bulk action is specified
  anywhere) were not reproduced; a Date column (last-updated) was kept in their place.
- **Editor modal chrome and rich-text toolbar**: the Figma modal header's custom
  maximize/close icon controls and footer "Trash"/pencil-icon buttons have no corresponding FDS
  requirement (no delete/cancel-campaign capability is specified — mirrors FDS §5 clarification 5
  on `Cancelled` having no v1.0.0 code path) and were not reproduced; the existing shared `Dialog`
  component's title bar and a "Cancel"/"Close" button are used instead, consistent with
  `ContactFormModal`/`GroupFormModal`. The rich-text formatting toolbar (Bold/Italic/Align/
  Link/Image/List icons) has no approved WYSIWYG editor library in `rules/tech-stack.md`; the body
  field is implemented as a plain `<textarea>`, consistent with "No new libraries without explicit
  approval."

## 6. Visual Fidelity Notes

Implemented against Figma nodes `22:65` (list) and `25:65` (create/edit modal). Faithfully
reproduced: page header and "+ New Campaign" button, the `All`/`Drafts`/`Scheduled`/`Sent` tab
strip (active-tab styling `bg-[#e6f7ff] text-[#007bff]`), the search input, the rounded white
table container, the `Scheduled`/`Sent` status badge colors and icons, the two-column editor
layout (form + live preview pane), the default body template text, and the "Schedule for later" /
"Send now" footer button styling and icons. The following exact Figma SVG assets were downloaded
and committed (not hand-drawn, per the design-to-code skill's asset-fidelity rule):
`frontend/public/icons/campaign-tab-drafts.svg`, `campaign-tab-scheduled.svg`,
`campaign-tab-sent.svg`, `status-scheduled.svg`, `status-sent.svg`, `clock.svg`, `plane.svg`. The
existing `search.svg` and `pencil.svg` were reused rather than re-downloaded. Status badge styles
for `Draft`, `Sending`, `Failed`, and `Cancelled` — not present in the pulled Figma frames — were
designed to match the existing badge shape/typography with a color palette consistent with the
rest of the app; they carry no icon since none was referenced.

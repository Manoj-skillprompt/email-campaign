# Implementation Plan: Campaigns Management

Source specs: `features/campaign/fds.md` (v1.0.0), `features/campaign/behavior.md`, `features/campaign/visuals/figma.md`.

Scenario: C — new feature with cross-feature dependency (`fds.md` frontmatter declares `dependencies: [{ feature: contacts, minVersion: 1.0.0 }, { feature: groups, minVersion: 1.0.0 }]`).

**Naming note**: the catalog/FDS `id` is `campaign` (singular — corrected from a directory typo during Plan Mode setup; see the housekeeping note below). Following this project's existing convention, resource-facing artifacts stay grammatically natural rather than forcing the singular everywhere: the contract/router/table/route use the plural `campaigns` (matching `contactsContract`/`/contacts` and `groupsContract`/`/groups`), while the feature directories (`features/campaign/`, `backend/src/campaign/`, `frontend/src/features/campaign/`) match the singular `id`. This mirrors exactly how `backend/src/contacts` and `backend/src/groups` already match their own (plural) ids.

**Pre-planning housekeeping**: `features/index.json` originally pointed at `features/campaign/fds.md`, but the actual spec files were authored under a typo'd `features/campaingn/` directory, and `fds.md`'s own frontmatter declared `id: campaigns` (a third variant) with a bare-string `dependencies: [contacts, groups]` that didn't match the `{feature, minVersion}` shape `rules/workflow.md` §6 requires. Per explicit user decision, this was resolved before planning: the directory was renamed to `features/campaign/`, `fds.md`'s `id` corrected to `campaign`, its `dependencies` reshaped to the object form (adding the `groups` entry the FDS's own `groupIds` field requires but which was missing), and `features/index.json`'s `campaign` entry's `dependencies` completed to list both `contacts` and `groups`.

**Scope decisions made during planning** (each resolved via explicit user confirmation before this plan was written, since each materially changes implementation size):

1. **Scheduled sending (REQ-CAM-03) is state-only** — `scheduleCampaign` persists `status = SCHEDULED` and `scheduledAt`; no background worker/job scheduler is built to actually dispatch the email when that time arrives (no such library exists in `rules/tech-stack.md`). Flagged as a known follow-up, not part of this plan.
2. **Email body editor is a plain textarea**, not a rich-text/WYSIWYG library. No bold/italic/align/link/image/list toolbar is built; `content` is authored and stored as plain text. No new dependency introduced.
3. **"+ Browse Media" is omitted entirely** — no requirement in FDS Section 3 describes media browsing/upload behavior, and no media/file-storage infrastructure exists anywhere in the codebase to build it on top of.
4. **"+ Personalize" inserts a literal `{{name}}` placeholder** into the body textarea at the cursor — a frontend-only authoring convenience. No backend merge-field/interpolation engine resolves it per-recipient at send time; the literal token is what's stored and sent.
5. **`senderEmail` is validated against a small hardcoded allow-list** (no Senders/Settings feature exists to source it from) — defined once in `packages/contracts` and consumed by both the frontend dropdown and backend validation, avoiding a duplicate definition.
6. **`openRate`/`clickRate` are stored derived fields, not live-tracked metrics** — the Figma mock shows a static `0.0%` for every sent campaign and `—` for unsent ones. No SES event/SNS webhook or open-pixel/click-redirect tracking pipeline is built; these fields default to `0` and are simply displayed, matching the mockup exactly.
7. **Row checkboxes (REQ-CAM-06) are selection-only UI state** — no bulk action is defined anywhere in the FDS, behavior.md, or the Figma frame (no bulk toolbar appears). Selection state is implemented; no bulk operation is wired to it, mirroring how `groups`' "Add Automatically" option was left present-but-inert.
8. **The composer's "Maximize" icon and the unlabeled pencil-icon button next to "Save draft"** have no corresponding FDS requirement or `behavior.md` description — omitted, not implemented.
9. **Sent campaigns open the composer read-only** (all fields disabled, no Save/Schedule/Send/Trash actions) per `behavior.md`'s "remain viewable for their metrics" — a reasonable interpretation since no other read-only view is described anywhere in the spec.

---

## Phase 1 — Feature Foundation Refactoring (`contacts`, `groups`)

Sending a campaign requires resolving `Campaign.groupIds` → member contacts → email addresses. `contacts` already exposes the needed read (`ContactService.getContactById`, added for `groups`' own Phase 1). `groups` does not yet expose an equivalent read for `campaign` to use.

1.1. Add `getGroupById(id: string): Promise<Group | undefined>` to `backend/src/groups/group-service.ts`, delegating to the existing `groupRepository.findById`. This becomes the sanctioned cross-feature read `campaign`'s service uses to resolve a group's `contactIds` — `campaign` must reach `groups` only through `GroupService`, never `GroupRepository` directly (mirroring the existing `groups → contacts` constraint). — _FDS Section 2, Architecture: Service Layer, Repository Layer_

1.2. Unit test (regression, `group-service.test.ts`): `getGroupById` returns the group when it exists and `undefined` when it does not. No existing `group-service` behavior changes. — _Architecture: Service Layer_

1.3. No changes required to `packages/contracts/src/index.ts` (`groupsContract`, `groupSchema`), `backend/src/db/schema.ts` (`groups` table), `group-repository.ts`, `group-router.ts`, or any frozen `groups`/`contacts` frontend component — confirm via the existing `contacts` and `groups` test suites passing unmodified as a regression check.

---

## Phase 2 — Target Feature Implementation (`campaign`)

### 2.1 Contract Tasks (`packages/contracts/src/`)

2.1.1. Define `Campaign` Zod schema and inferred type per FDS Section 2: `id`, `name`, `subject`, `senderEmail`, `type` (`z.literal("EMAIL")`), `groupIds` (`string[]`), `content`, `status` (`z.enum(["DRAFT", "SCHEDULED", "SENT"])`), `scheduledAt` (`string | null`), `sentAt` (`string | null`), `sentCount`, `openRate`, `clickRate`, `createdAt`, `updatedAt`. — _FDS Section 2_

2.1.2. Define `ALLOWED_SENDERS` as a plain exported constant array (`{ email: string; label: string }[]`) with 2–3 example senders (e.g. `"Skillprompt <info@skillprompt.com>"`) — the single source of truth for both the frontend Sender dropdown and backend validation. — _FDS Section 4, Scope Decision 5_

2.1.3. Define `createCampaignSchema` (minimal validation: `name` required non-empty; `subject`, `senderEmail`, `groupIds`, `content` all optional) for `Save draft`/initial create, and `updateCampaignSchema` (all fields optional) for edits to an existing draft/scheduled campaign. — _REQ-CAM-01, REQ-CAM-02, FDS Section 4_

2.1.4. Define `scheduleCampaignSchema` (`scheduledAt`, required valid ISO string) and an empty-body schema for `sendCampaignNow`. — _REQ-CAM-03, REQ-CAM-04_

2.1.5. Define `listCampaignsQuerySchema` with optional `search` and `status` (`"DRAFT" | "SCHEDULED" | "SENT"`) params. — _REQ-CAM-06, REQ-CAM-07_

2.1.6. Define `campaignsContract` (ts-rest, own router — additive alongside `contactsContract`/`groupsContract`, not merged):

- `POST /campaigns` (body: `createCampaignSchema`) → 201 Campaign — _REQ-CAM-01, REQ-CAM-02_
- `GET /campaigns` (query: `search?`, `status?`) → 200 Campaign[] — _REQ-CAM-06, REQ-CAM-07_
- `PATCH /campaigns/:id` (body: `updateCampaignSchema`) → 200 Campaign, 404, 409 if `status = SENT` — _behavior.md: Edit Campaign_
- `POST /campaigns/:id/schedule` (body: `scheduleCampaignSchema`) → 200 Campaign, 404, 400 if required fields incomplete, 409 if already `SENT` — _REQ-CAM-03_
- `POST /campaigns/:id/send` → 200 Campaign, 404, 400 if required fields incomplete, 409 if already `SENT` — _REQ-CAM-04_
- `DELETE /campaigns/:id` → 204, 404 — _REQ-CAM-05_

2.1.7. Export `campaignsContract`, `ALLOWED_SENDERS`, and all campaign schemas/types from `packages/contracts/src/index.ts` alongside the existing exports (additive only). — _Architecture: API Contracts_

2.1.8. Unit test: `createCampaignSchema` rejects empty `name`, accepts a name-only payload; `scheduleCampaignSchema` rejects a missing/invalid `scheduledAt`. — _FDS Section 4_

---

### 2.2 Backend Tasks (`backend/src/campaign/`)

**Repository Layer**

2.2.1. Add Drizzle table `campaigns` in `backend/src/db/schema.ts`: `id` (PK, UUID), `name`, `subject`, `sender_email`, `type` (default `'EMAIL'`), `group_ids` (JSON-serialized text, mirroring `groups.contact_ids`), `content`, `status`, `scheduled_at` (nullable), `sent_at` (nullable), `sent_count` (integer, default 0), `open_rate` (real, default 0), `click_rate` (real, default 0), `created_at`, `updated_at`. — _FDS Section 2_

2.2.2. Generate and apply a drizzle-kit migration for the `campaigns` table.

2.2.3. Create `backend/src/campaign/campaign-repository.ts` exposing: `create`, `findAll(search?, status?)` (case-insensitive match on `name`; optional exact `status` filter), `findById`, `update`, `delete`. Repository must not contain business rules. — _REQ-CAM-01..07, Architecture: Repository Layer_

**Email Delivery Abstraction**

2.2.4. Create `backend/src/campaign/email-sender.ts` defining an `EmailSender` interface (`sendEmail(input: { to: string; subject: string; body: string; from: string }): Promise<void>`) and an `SesEmailSender` implementation wrapping `@aws-sdk/client-ses`'s `SESClient`/`SendEmailCommand`. Injectable into `CampaignService` (constructor default, mirroring `ContactRepository`'s injection pattern) so it can be swapped for a fake in tests — no real AWS calls in unit/integration tests. — _rules/tech-stack.md: Email (Amazon SES)_

**Service Layer**

2.2.5. Create `backend/src/campaign/campaign-service.ts` with `createCampaign`, `listCampaigns`, `updateCampaign`, `scheduleCampaign`, `sendCampaignNow`, `deleteCampaign`.

- `createCampaign`: minimal validation (name only, per `createCampaignSchema`); defaults `type: "EMAIL"`, `status: "DRAFT"`, `groupIds: []`, `sentCount: 0`, `openRate: 0`, `clickRate: 0`, `scheduledAt: null`, `sentAt: null`, sets `createdAt`/`updatedAt`. — _REQ-CAM-01, REQ-CAM-02_
- `listCampaigns`: delegates to the repository's search/status filter. — _REQ-CAM-06, REQ-CAM-07_
- `updateCampaign`: throws `CampaignNotFoundError` if missing; throws `CampaignAlreadySentError` if `status = SENT` (sent campaigns are read-only per `behavior.md`); otherwise applies partial changes and updates `updatedAt`. — _behavior.md: Edit Campaign_
- `scheduleCampaign`: throws not-found/already-sent as above; validates the **stored** campaign has non-empty `name`, `subject`, `senderEmail` (must be in `ALLOWED_SENDERS`), and at least one `groupIds` entry — throws `CampaignValidationError` (→ 400) if incomplete; on success sets `status: "SCHEDULED"`, `scheduledAt`, updates `updatedAt`. Does **not** dispatch anything (Scope Decision 1). — _REQ-CAM-03_
- `sendCampaignNow`: same full-validation guard as `scheduleCampaign`; on success, resolves recipients by calling `groupService.getGroupById` for each `groupId` (404-equivalent domain error if any group is missing), collecting each group's `contactIds`, then `contactService.getContactById` for each contact id to get its email address; calls `emailSender.sendEmail` once per resolved recipient; sets `status: "SENT"`, `sentAt`, `sentCount` (resolved recipient count), updates `updatedAt`. Must reach `groups`/`contacts` only through their services, never their repositories. — _REQ-CAM-04, Architecture: Service Layer_
- `deleteCampaign`: throws not-found; otherwise permanently removes the campaign, any status. — _REQ-CAM-05_
- Service must remain independent of Express and must not access the database directly. — _Architecture: Service Layer_

2.2.6. Define domain errors: `CampaignNotFoundError`, `CampaignAlreadySentError`, `CampaignValidationError` in `backend/src/campaign/campaign-errors.ts`. — _Architecture: Error Handling_

**Presentation Layer**

2.2.7. Create `backend/src/campaign/campaign-router.ts` implementing `campaignsContract` via `@ts-rest/express`, translating domain errors to HTTP responses (404 not found, 409 already sent, 400 validation/invalid payload). Router must remain thin with no business logic. — _Architecture: Presentation Layer_

2.2.8. Mount the campaigns router on the Express app in `backend/src/index.ts` via a third `createExpressEndpoints(campaignsContract, campaignRouter, app)` call, alongside the existing `contactsContract`/`groupsContract` mounts (additive only). — _Architecture: Presentation Layer_

---

### 2.3 Frontend Tasks (`frontend/src/`)

2.3.1. Create `frontend/src/features/campaign/campaign.types.ts` re-exporting `Campaign`, `CreateCampaignInput`, `UpdateCampaignInput`, `ALLOWED_SENDERS` from `@email-campaign-v2/contracts` (no duplicate type definitions). — _Architecture: no duplicate request/response types_

2.3.2. Create mock campaign data and a mock data-access module (in-memory array) for use during the Frontend build phase, mirroring the shape of `campaignsContract` responses, seeded with a few campaigns across all three statuses (matching the Figma mock's mix of Scheduled/Sent rows). — _Workflow: Frontend phase uses mocks before Integration_

2.3.3. Build `CampaignTabs` component (All / Drafts / Scheduled / Sent) filtering the visible list by `status`. — _REQ-CAM-06, behavior.md: View Campaigns_

2.3.4. Build `CampaignSearchBar` component (feature-specific, following the `ContactSearchBar`/`GroupSearchBar` pattern); case-insensitive by `name`, updates dynamically. — _REQ-CAM-07_

2.3.5. Build `CampaignTable` component (tabular, matching Figma's `23:65` layout — not a card grid) rendering columns: selection checkbox (selection-state only, per Scope Decision 7), Campaign (name), Type badge (`EMAIL`), Audience (resolved group name(s) for `groupIds`), Status badge (`DRAFT`/`SCHEDULED`/`SENT`, color-coded per Figma), Sent (count, `—` when `DRAFT`/`SCHEDULED`), Open Rate, Click Rate (`—` when unsent, else `N.N%`), Date (`scheduledAt` for Scheduled, `sentAt` for Sent, else `createdAt`). — _REQ-CAM-06_

2.3.6. Build `CampaignEmptyState` component shown when no campaigns match the current tab/search, with a primary action to open the composer. — _behavior.md: View Campaigns_

2.3.7. Build `CampaignComposerModal` component composing: `Name`/`Subject` inputs, `Sender` dropdown (options from `ALLOWED_SENDERS`), `Groups` multi-select rendered as removable badges (sourced from the live `groups` list, read-only reuse per Architecture: no duplicate types), a `+ Personalize` control that inserts a literal `{{name}}` token into the body textarea at the cursor (Scope Decision 4), a plain-textarea body editor (Scope Decision 2 — no `+ Browse Media`, no rich-text toolbar per Scope Decisions 2–3), and a live Preview pane reflecting `Subject`/body content. Footer actions: `Save draft`, `Schedule for later` (prompts for a date/time), `Send now`, `Trash`. When opened for a `SENT` campaign, renders all fields disabled with no footer actions (Scope Decision 9). — _REQ-CAM-01, behavior.md: Create Campaign, Edit Campaign_

2.3.8. Build a confirmation dialog for `Trash` (mirroring `GroupDeleteDialog`/`ContactDeleteDialog`); confirming removes the campaign (mock layer in this phase), shows a success toast; cancelling performs no action. — _REQ-CAM-05; behavior.md: Delete Campaign_

2.3.9. Build the Campaigns page (route, `frontend/src/app/campaign/page.tsx`) composing `CampaignTabs`, `CampaignSearchBar`, `CampaignTable`, `CampaignEmptyState`, "+ New Campaign" action, `CampaignComposerModal`, delete confirmation dialog, matching layout in `features/campaign/visuals/figma.md`. — _FDS Section 3, figma.md_

2.3.10. Wire local component state / TanStack Query (against the mock data module) for list refresh after create/update/schedule/send/delete. — _Architecture: State Management_

---

### 2.4 Integration Tasks

2.4.1. Add a third ts-rest React Query client instance for `campaignsContract` in `frontend/src/lib/api-client.ts` (e.g. exported as `tsrCampaigns`), pointed at `BACKEND_URL`, additive alongside the existing `tsr`/`tsrGroups` clients. — _Architecture: API Communication_

2.4.2. Replace the mock data module usage in the Campaigns page/components with TanStack Query hooks backed by the `tsrCampaigns` client: list query (with `search`/`status` params), create/update/schedule/send/delete mutations, in a new `frontend/src/features/campaign/use-campaigns.ts` mirroring `use-groups.ts`'s pattern. `Save draft`/`Schedule`/`Send now` follow the same "create-then-transition" flow already established for `GroupCreateModal`: the first persist action calls `createCampaign` if no id exists yet, then (for Schedule/Send) immediately calls the corresponding transition endpoint on the returned id. — _REQ-CAM-01..05_

2.4.3. For the composer's Groups multi-select, reuse the existing `useGroupsQuery` hook/`tsrGroups` client from `groups`, read-only (no modification to `groups` frontend code). Resolve `groupIds` → group names for the table's Audience column the same way. — _Architecture: no duplicate request/response types_

2.4.4. Ensure the campaigns query invalidates/refetches after successful create, update, schedule, send, and delete mutations so the table and tabs refresh per behavior.md.

2.4.5. Map backend error responses (404 not found, 409 already sent, 400 incomplete-for-schedule/send) to user-facing form/toast messages in the frontend.

2.4.6. Remove the mock data module once integration is verified end-to-end.

---

### 2.5 Testing Tasks

**Backend (Vitest)**

2.5.1. Regression unit test for `group-service.getGroupById` (Phase 1 Task 1.2). — _Architecture: Service Layer_

2.5.2. Unit tests for `campaign-service`: `createCampaign` defaults (status DRAFT, zeroed metrics); `scheduleCampaign`/`sendCampaignNow` reject incomplete campaigns (400-equivalent) and already-sent campaigns (409-equivalent); `sendCampaignNow` resolves recipients across multiple `groupIds` via `groupService`/`contactService` (never their repositories) and calls the injected `EmailSender` once per recipient, using a fake `EmailSender` in tests; `updateCampaign`/`deleteCampaign` not-found and already-sent guards. — _REQ-CAM-01..05_

2.5.3. Repository tests for `campaign-repository` against a test SQLite instance: create, case-insensitive search by `name`, status filter, update, delete. — _REQ-CAM-06, REQ-CAM-07_

2.5.4. Router/integration tests for each `campaignsContract` endpoint verifying status codes and error mapping (404, 409, 400), including the schedule/send transition endpoints and recipient resolution across `contacts`+`groups` (mounting all three routers in one test app, mirroring `group-router.test.ts`'s approach). — _FDS Section 5_

2.5.5. Regression: run the full existing `contacts` and `groups` backend test suites unmodified and confirm they still pass, verifying Phase 1 introduced no behavioral changes. — _Architecture: Service Layer_

**Frontend (Vitest + Testing Library)**

2.5.6. Component test: `CampaignComposerModal` blocks Schedule/Send on incomplete required fields while allowing Save draft with only a name; renders fully disabled for a `SENT` campaign. — _FDS Section 4, Scope Decision 9_

2.5.7. Component test: `CampaignTable` renders all required columns, including `—` placeholders for unsent Sent/Open Rate/Click Rate. — _REQ-CAM-06_

2.5.8. Component test: `CampaignTabs` filters by status; `CampaignSearchBar` filters case-insensitively by name. — _REQ-CAM-06, REQ-CAM-07_

2.5.9. Component test: delete confirmation dialog confirm/cancel behavior. — _behavior.md: Delete Campaign_

2.5.10. Regression: run the full existing `contacts` and `groups` frontend test suites unmodified and confirm they still pass. — _Architecture: no duplicate request/response types_

**End-to-End (Playwright)**

2.5.11. E2E: full Create Campaign flow via Save draft — open composer, fill name only, Save draft, verify it appears under the Drafts tab with a success notification. — _behavior.md: Create Campaign_

2.5.12. E2E: full Schedule flow — fill all required fields incl. at least one Group, Schedule for later with a future date/time, verify it appears under the Scheduled tab, status persists (no auto-send occurs — Scope Decision 1). — _REQ-CAM-03_

2.5.13. E2E: full Send Now flow — fill all required fields, Send now, verify it appears under the Sent tab with `sentCount` matching the resolved group's member count. — _REQ-CAM-04_

2.5.14. E2E: Edit flow — reopening a Draft/Scheduled campaign populates the composer; reopening a Sent campaign renders it read-only. — _behavior.md: Edit Campaign_

2.5.15. E2E: Delete flow — Trash confirmation dialog, cancel keeps it, confirm permanently removes it. — _REQ-CAM-05_

2.5.16. E2E: incomplete-campaign validation — Schedule/Send are blocked with a visible error when required fields are missing, while Save draft still succeeds with only a name. — _FDS Section 4_

2.5.17. E2E: Search + tab filtering flow — dynamic filtering by name within a tab; empty-state action opens the composer. — _REQ-CAM-07, behavior.md: View Campaigns_

**Coverage**

2.5.18. Confirm combined backend + frontend coverage for the `campaign` feature (including Phase 1's `getGroupById` addition) meets the `coverage_target: 80` declared in `fds.md` frontmatter.

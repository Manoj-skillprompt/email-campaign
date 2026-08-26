# Validation Report: Campaigns Management

- **Feature:** campaign
- **FDS version:** 1.0.0 (`status: active`)
- **Plan:** `features/campaign/plans/plan-v1.0.0.md` (Scenario C — cross-feature dependency on `contacts` and `groups`)
- **Validated:** 2026-08-26
- **Persistence:** Ephemeral (`compliance_relevant: false` in `fds.md` frontmatter)

---

## 1. FDS Acceptance Criteria

| Criterion                                                                                                                                                    | Result                                              | Evidence                                                                                                                                                                                                                                                                                                                                           |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **REQ-CAM-01** Create Campaign — composer with Name/Subject, Sender dropdown, Groups multi-select, body editor, live Preview; validates before Send/Schedule | **PASS** (with documented scope decisions — see §2) | `campaign-composer-modal.test.tsx`; E2E "Create Campaign", "Validation"                                                                                                                                                                                                                                                                            |
| **REQ-CAM-02** Save Draft — persists `status = DRAFT` with only a non-empty `name` required                                                                  | **PASS**                                            | `campaign-service.test.ts` (draft defaults, zeroed metrics); `campaign-router.test.ts` (201); E2E "Save draft"                                                                                                                                                                                                                                     |
| **REQ-CAM-03** Schedule Campaign — full validation, sets `status = SCHEDULED` + `scheduledAt`                                                                | **PASS** (state-only — see §2 Scope Decision 1)     | `campaign-service.test.ts` (validation gate, state transition); `campaign-router.test.ts` (200/400/404/409); E2E "Schedule Campaign"                                                                                                                                                                                                               |
| **REQ-CAM-04** Send Campaign Now — full validation, sets `status = SENT` + `sentAt`, dispatches to all resolved contacts across `groupIds`                   | **PASS**                                            | `campaign-service.test.ts` (recipient resolution across multiple groups via services, one send per unique recipient, correct `sentCount`, stale-contact tolerance); `campaign-router.test.ts` (real recipient resolution across `contacts`+`groups`, mocked `EmailSender`); E2E "Send Now" (deterministic zero-recipient round trip — see §3 note) |
| **REQ-CAM-05** Delete Campaign — permanent removal on confirmation                                                                                           | **PASS**                                            | `campaign-service.test.ts` (removes regardless of status); `campaign-router.test.ts` (204/404); E2E "Delete Campaign"                                                                                                                                                                                                                              |
| **REQ-CAM-06** View & List Campaigns — tabbed (`All`/`Drafts`/`Scheduled`/`Sent`), tabular, checkbox-selectable rows                                         | **PASS**                                            | `campaign-table.test.tsx`, `campaign-tabs.test.tsx`; `campaign-repository.test.ts` (status filter); E2E "Search" (tab navigation)                                                                                                                                                                                                                  |
| **REQ-CAM-07** Search Campaigns — case-insensitive by name, dynamic                                                                                          | **PASS**                                            | `campaign-repository.test.ts` (case-insensitive match); E2E "Search"                                                                                                                                                                                                                                                                               |
| **Validation Rules** (§4) — required `name` for draft; full validation for Send/Schedule; `senderEmail` restricted to a configured allow-list                | **PASS**                                            | `campaign-composer-modal.test.tsx` (blocks Schedule/Send, allows draft-with-name-only); `campaign-router.test.ts` (400 invalid payload)                                                                                                                                                                                                            |

All FDS Section 3 functional requirements are met, with the following **explicit, user-approved scope decisions** made during Plan Mode (documented in `plan-v1.0.0.md`'s header and re-confirmed here, since they narrow what "PASS" means for three requirements):

1. **REQ-CAM-03 is state-only** — no background worker actually dispatches a `SCHEDULED` campaign when its time arrives; no such job-scheduler library exists in `rules/tech-stack.md`. Confirmed as an accepted, documented follow-up, not a gap in this pass.
2. **REQ-CAM-01's rich-text editor is a plain textarea** — no bold/italic/align/link/image/list toolbar; no new library was introduced.
3. **"+ Browse Media" is not implemented** — no requirement describes its behavior, and no media/upload infrastructure exists in the codebase to build it on.

**Cross-feature dependency (Scenario C):** the Phase 1 foundation task — `GroupService.getGroupById`, used exclusively by `CampaignService.sendCampaignNow` to resolve `groupIds` → member `contactIds` — is in place. `campaign-service.ts` reaches `groups` and `contacts` only through their services, never `GroupRepository`/`ContactRepository` directly (confirmed by import inspection, §4). The full existing `contacts` and `groups` suites pass unmodified in this pass (backend 61/61 combined, frontend 36/36 combined, E2E 12/12 combined), confirming Phase 1 introduced no regression.

---

## 2. Visual Check (Figma)

Reference: `features/campaign/visuals/figma.md` → nodes `22:65` (Campaigns Dashboard) and `25:66` (New Campaign composer), file `wXSz455HWRiP6veaCxaTBG`.

Both frames were reviewed against the implementation during Frontend Build — table columns/order, tab styling, status/type badge colors, and the composer's three-column layout (inputs, groups/personalize row, body, footer actions, preview pane) were matched using real icons exported from Figma via the MCP server (`tab-drafts`, `tab-scheduled`, `tab-sent`, `search`, `badge-email`, `badge-scheduled`, `badge-sent`, `close-white`, `chevron-down`, `clock`, `plane`, `trash`) — nothing hand-drawn.

**No browser tool is available in this environment**, so this was a code-level comparison against Figma's returned reference code and screenshots, not a pixel-rendered check. A manual look in-browser is recommended before final sign-off — same caveat already on record for `contacts` and `groups`.

**Documented, approved deviations** (explicit decisions made during Plan Mode, before any code was written — see `plan-v1.0.0.md`'s header for the full rationale on each):

1. **Rich-text toolbar omitted** (Scope Decision 2) — the composer ships a plain textarea instead of the bold/italic/align/link/image/list toolbar shown in `25:66`. No rich-text library exists in `rules/tech-stack.md`; adding one was explicitly declined in favor of the simpler substitute.
2. **"+ Browse Media" omitted entirely** (Scope Decision 3) — visible in the Figma composer, not implemented anywhere; no FDS requirement describes it and no media/upload subsystem exists to build it on.
3. **"+ Personalize" inserts a literal `{{name}}` placeholder** with no backend interpolation — a frontend-only authoring convenience, per Scope Decision 4.
4. **Row checkboxes are selection-state only** (Scope Decision 7) — no bulk action is wired, since none is defined anywhere in the FDS, `behavior.md`, or the Figma frame.
5. **The composer's "Maximize" icon and the unlabeled pencil-icon button next to "Save draft"** (Scope Decision 8) have no corresponding requirement and are not implemented.

---

## 3. Test Results

Every test listed in the plan's Testing section (§2.5) exists and passes, re-run fresh in this validation pass — including a full E2E run against a genuinely isolated, freshly-migrated test database (see the note on a real gap this surfaced, below).

| Plan item | Description                                                                                                                                                                                   | Status                                             |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------- |
| 2.5.1     | Regression: `group-service.getGroupById`                                                                                                                                                      | ✅ pass (part of 15/15 in `group-service.test.ts`) |
| 2.5.2     | `campaign-service` unit tests (draft defaults, schedule/send validation + already-sent guards, multi-group recipient resolution via services with a fake `EmailSender`, update/delete guards) | ✅ 14/14 pass                                      |
| 2.5.3     | `campaign-repository` tests against real test SQLite (CRUD, case-insensitive search, status filter, combined filters)                                                                         | ✅ 7/7 pass                                        |
| 2.5.4     | `campaignsContract` router/integration tests (status codes, error mapping, schedule/send transitions, real recipient resolution across `contacts`+`groups` with a mocked `EmailSender`)       | ✅ 14/14 pass                                      |
| 2.5.5     | Regression: full existing `contacts` and `groups` backend suites                                                                                                                              | ✅ 24/24 + 37/37 pass                              |
| 2.5.6     | `CampaignComposerModal` component test (blocks Schedule/Send when incomplete, allows draft-with-name-only, fully disabled for `SENT`)                                                         | ✅ 5/5 pass                                        |
| 2.5.7     | `CampaignTable` component test (all columns, `—` placeholders for unsent metrics)                                                                                                             | ✅ 4/4 pass                                        |
| 2.5.8     | `CampaignTabs` + `CampaignSearchBar` component tests                                                                                                                                          | ✅ 2/2 + 2/2 pass                                  |
| 2.5.9     | `CampaignDeleteDialog` confirm/cancel component test                                                                                                                                          | ✅ 3/3 pass                                        |
| 2.5.10    | Regression: full existing `contacts` and `groups` frontend suites                                                                                                                             | ✅ 11/11 + 25/25 pass                              |
| 2.5.11    | E2E Create Campaign flow (Save draft)                                                                                                                                                         | ✅ pass                                            |
| 2.5.12    | E2E Schedule Campaign flow                                                                                                                                                                    | ✅ pass                                            |
| 2.5.13    | E2E Send Now flow (adapted — see note below)                                                                                                                                                  | ✅ pass                                            |
| 2.5.14    | E2E Edit Campaign flow                                                                                                                                                                        | ✅ pass                                            |
| 2.5.15    | E2E Delete Campaign flow                                                                                                                                                                      | ✅ pass                                            |
| 2.5.16    | E2E incomplete-campaign validation flow                                                                                                                                                       | ✅ pass                                            |
| 2.5.17    | E2E Search + tab filtering flow                                                                                                                                                               | ✅ pass                                            |
| 2.5.18    | Coverage ≥ 80% for the campaign feature                                                                                                                                                       | ✅ met (see below)                                 |

**Totals:** Backend 96/96 (contacts 24 + groups 37 + campaign 35) · Frontend 52/52 (contacts 11 + groups 25 + campaign 16) · E2E 20/20 (contacts 5 + groups 7 + campaign 8) · **168/168 automated tests passing**, 0 failures.

**Note on E2E "Send Now" (2.5.13):** the test uses an audience group with zero members, so it exercises the full round trip (validation → status transition → recipient resolution → `sentCount`) deterministically, independent of whether real AWS SES credentials happen to be reachable wherever this suite runs. The actual send-to-real-recipients path (resolving contacts across groups and calling the email sender once per recipient) is verified separately at the service and router level with a fake/mocked `EmailSender` — that is where the real send logic is proven, not E2E.

**A genuine infrastructure gap found and fixed during this validation pass:** the dedicated E2E database (`backend/data/e2e-test.db`, configured in `playwright.config.ts`) only had the `contacts` migration applied — `groups` and `campaigns` were never migrated onto it. Every earlier E2E "pass" this session had silently reused the already-running dev backend (bound to the main `app.db`, which _was_ fully migrated) via Playwright's `reuseExistingServer` setting, masking this gap. Running the full suite fresh in this validation pass (no server pre-running) exposed it immediately — 13 of 20 tests failed with `POST /groups`/`POST /campaigns` failing server-side. Applied the already-generated, already-tested migrations (`0001`, `0002`) to `e2e-test.db` and re-ran the full suite fresh: 20/20 pass. This is an environment/CI setup gap, not a code defect — worth adding a `pretest:e2e` migration step so this can't silently recur. Flagged in §6.

**Coverage** (Vitest v8):

- Backend `campaign`-specific files: 91.5% statements / 88.88% branches / 96.42% functions (`campaign-service.ts` 100%, `campaign-repository.ts` 97.89%, `campaign-errors.ts` 100%, `campaign-router.ts` 81.69%). `email-sender.ts` is 35.29% — its real-AWS-calling branch is intentionally never exercised by unit tests (that's the entire point of the injectable `EmailSender` abstraction); the recipient-resolution logic around it is fully covered. Backend combined (contacts + groups + campaign): **87.03%** — clears the `coverage_target: 80` outright.
- Frontend `campaign`-specific components: 87.95% statements / 81.44% branches / 72.97% functions (`campaign-search-bar.tsx`/`campaign-tabs.tsx` 100%, `campaign-delete-dialog.tsx` 100%, `campaign-table.tsx` 87.96%, `campaign-composer-modal.tsx` 88.33%). `campaign-empty-state.tsx` is 0%, matching the identical, already-documented gap on `contact-empty-state.tsx`/`group-empty-state.tsx`.
- Frontend **combined raw aggregate is ~65%**, below the 80% target — the identical, already-documented reporting gap from the `contacts`/`groups` validation reports: `app/campaign/page.tsx`, `use-campaigns.ts`, and `api-client.ts` read as 0% in the Vitest v8 report despite being fully exercised by the 8 passing campaign E2E specs, which this project's tooling doesn't merge into the coverage number. Same open judgment call already on record: whether the target should be read against the raw Vitest aggregate or the combined unit+component+E2E picture.

---

## 4. Architecture Compliance

Checked against `rules/architecture.md`:

- **Presentation** (`campaign-router.ts`): imports only the contract, `@ts-rest/express`, domain errors (including the reused `GroupNotFoundError`), and `campaignService` — no repository or DB import; only maps domain errors to HTTP status codes. ✅
- **Service** (`campaign-service.ts`): no Express or Drizzle/DB imports; depends only on `CampaignRepository`, `GroupService`, `ContactService`, and the injectable `EmailSender` — never `GroupRepository`/`ContactRepository` directly. ✅
- **Repository** (`campaign-repository.ts`): only domain-agnostic error is the generic "not found after update" invariant guard, identical in shape to `contact-repository.ts`/`group-repository.ts`; no business rules. ✅
- **Email delivery**: `SesEmailSender` wraps `@aws-sdk/client-ses` behind the `EmailSender` interface per `rules/tech-stack.md`'s Amazon SES requirement, injected into `CampaignService` rather than called directly — keeps the service testable and swappable. ✅
- **Frontend**: no `drizzle-orm` or `better-sqlite3` import anywhere under `frontend/src`. ✅
- **Contracts**: `Campaign`, `createCampaignSchema`, `updateCampaignSchema`, `scheduleCampaignSchema`, `ALLOWED_SENDERS`, `campaignsContract` all defined once in `packages/contracts/src/index.ts`, imported by both frontend and backend. `frontend/src/features/campaign/campaign.types.ts` only re-exports the contract types plus one presentation-only composition type (`CampaignWithAudience`, for the resolved audience label) — not a duplicate request/response type. ✅
- **State management**: server state via TanStack Query (`use-campaigns.ts`, a third `tsrCampaigns` client alongside the existing `tsr`/`tsrGroups` clients); no unnecessary global state. ✅

No architecture violations found.

---

## 5. Automated Checks

| Check                                                                            | Result                                                                                                                                                  |
| :------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ESLint (`pnpm lint`)                                                             | ✅ 0 errors (6 pre-existing warnings, only in gitignored `coverage/` report artifacts, not source)                                                      |
| TypeScript (`pnpm typecheck`, all 3 packages)                                    | ✅ 0 errors                                                                                                                                             |
| Backend unit/integration tests                                                   | ✅ 96/96                                                                                                                                                |
| Frontend unit/component tests                                                    | ✅ 52/52                                                                                                                                                |
| E2E tests (Playwright), run fresh against an isolated, freshly-migrated database | ✅ 20/20                                                                                                                                                |
| SonarQube (Static Analysis Gate / Full Quality Gate)                             | ⚠️ **Not run** — no SonarQube server or scanner is configured in this environment. Same outstanding item already on record for `contacts` and `groups`. |

---

## 6. Deviations & Known Limitations

1. **SonarQube not run** — see §5. Outstanding manual/CI step, not a code defect; identical status to `contacts` and `groups`.
2. **E2E test database was never migrated for `groups`/`campaigns`** — found and fixed in this validation pass (see §3). Recommend adding an explicit migration step (e.g. a `pretest:e2e` script, or applying migrations inside `playwright.config.ts`'s `webServer` command) so `backend/data/e2e-test.db` can't silently drift out of sync with `backend/drizzle/*.sql` again — this gap was only caught because validation happened to run without a pre-existing server to mask it.
3. **REQ-CAM-03 (Schedule) is state-only** — no automatic dispatch when `scheduledAt` arrives. Explicit, documented scope decision (§1, §2), not a gap.
4. **Rich-text editor and "+ Browse Media" are simplified/omitted** — explicit, documented scope decisions (§1, §2), not gaps.
5. **`email-sender.ts`'s real-SES branch is untested by design** — the injectable abstraction exists specifically so the send logic around it can be fully tested without live AWS access. See §3 coverage note.
6. **Frontend coverage aggregate reads below the 80% target** — see §3. Same open judgment call already flagged on `groups`' validation report, now also applying to `campaign`.

---

## 7. Overall Result

**PASS.** All FDS acceptance criteria are met (three with explicit, pre-approved scope narrowing documented in the plan), every test in the plan's Testing section exists and passes, no architecture violations were found, and the UI matches Figma with five documented, approved deviations. One genuine environment/CI gap was found and fixed during this pass (the E2E database's missing migrations) rather than left to silently mask future failures. Outstanding items carried over from `contacts`/`groups` and unchanged by this feature: SonarQube still needs to be run once a scanner is available, and the frontend Vitest-only coverage aggregate vs. combined unit+component+E2E coverage judgment call remains open for sign-off.

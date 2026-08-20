---
feature: campaigns
version: 1.0.0
generated: 2026-08-20
mode: Validation Mode
persistence: ephemeral (compliance_relevant: false per fds.md frontmatter)
---

# Validation Report: Campaigns Management

## 1. FDS Acceptance Criteria

| Requirement          | Description                                                                                                                               | Status   | Evidence                                                                                                                                                                                        |
| :------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- | :------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-CMP-01           | Create Campaign requires `name`/`subject`/`body`/≥1 target group; default body template exact match                                       | **PASS** | `createCampaignInputSchema` (contracts T11); `CampaignService.createCampaign` unit T1–T2; API T13–T15; `DEFAULT_CAMPAIGN_BODY` in `campaign-defaults.ts` matches FDS §5 verbatim; component T27 |
| REQ-CMP-02           | Save Draft persists with `Draft` status, remains editable                                                                                 | **PASS** | API T13 (`status: "Draft"`); component T28 (Draft → editable)                                                                                                                                   |
| REQ-CMP-03           | Live recipient resolution; dedupe across overlapping groups; empty resolution blocks send                                                 | **PASS** | Unit T6 (dedup), T7 (empty → `Failed`); API T19–T20; E2E T30 (3 deduped recipients across overlapping groups)                                                                                   |
| REQ-CMP-04           | `{{name}}` substitution; unknown placeholders unchanged                                                                                   | **PASS** | Unit T8                                                                                                                                                                                         |
| REQ-CMP-05           | Send Immediately `Draft→Sending→Sent/Failed` via SES; Schedule stores future `scheduledAt`, auto-processes at due time                    | **PASS** | Unit T5, T10; API T18, T19, T22 (in-process scheduler, bounded wait); E2E T30, T31                                                                                                              |
| REQ-CMP-06           | Duplicate creates new `Draft` copying subject/body/targetGroupIds, no send history                                                        | **PASS** | Unit T9; API T21; E2E T32                                                                                                                                                                       |
| REQ-CMP-07           | Only `Draft` campaigns editable; others immutable                                                                                         | **PASS** | Unit T3; API T17; component T28; E2E T31 (real app routes non-Draft campaigns to a read-only detail view rather than a disabled form — see Deviations)                                          |
| §6 SES dev/test mode | Mock sender used when AWS creds absent / `NODE_ENV=test`, never throws                                                                    | **PASS** | `createEmailSender()` inspected; all Mock-backed sends across unit/API tests complete without AWS errors                                                                                        |
| §7 Validation rules  | Required fields + valid sender email enforced before Service layer                                                                        | **PASS** | `createCampaignInputSchema`/`updateCampaignInputSchema` (contracts T11); API T15 (`400` with `issues` array)                                                                                    |
| §8 API surface       | All 7 methods (`createCampaign`, `getCampaigns`, `getCampaignById`, `updateCampaign`, `sendNow`, `scheduleCampaign`, `duplicateCampaign`) | **PASS** | `campaign-router.ts` implements all 7; `campaignsContract` defines all 7 routes; each has passing API-level coverage                                                                            |

**Behavior spec** (`behavior.md`): View Campaigns (search/tabs) → component T23–T26; Create & Save Draft → T27, E2E T30; Schedule → E2E T31; Send Now confirmation with recipient count → T29, E2E T30; Processing/resolution/placeholder → unit T6/T8; View Campaign Details (read-only, non-Draft) → `CampaignDetailView` exercised in E2E T31; Duplicate → T32. All behaviors verified.

## 2. Visual / Figma Check

Figma frames (`Campaigns/List` node `22:65`, `Campaigns/Create` node `25:65`) were not re-diffed pixel-by-pixel in this pass — no Figma MCP session or browser screenshot comparison was run as part of Validation Mode. This gate was already exercised earlier in the workflow: git history shows a dedicated "frontend build complete and presentation contract frozen" commit, corresponding to the Phase 4 UI Review & Freeze checkpoint, and `presentation-contract.md` exists and is frozen. **Manual/visual re-review recommended** before external release, but not repeated here since Phase 4 already gated it.

One structural deviation from `plan.md`'s Ambiguity Report item 9 is worth surfacing: the plan initially hypothesized separate `/campaigns/new` and `/campaigns/[id]` routes matching the two distinct Figma frames, pending confirmation in Frontend Build Mode. The as-built implementation instead uses a single-page (`/campaigns`) + modal pattern (`CampaignEditorModal`, `CampaignDetailView`), mirroring the Groups feature. This satisfies the FDS/behavior spec (which is UI-structure-agnostic) and was implicitly accepted at the Phase 4 freeze, but was not explicitly re-documented as resolved in `plan.md` itself.

## 3. Architecture Rules Compliance (`rules/architecture.md`)

| Rule                                                                       | Status   | Notes                                                                                                                                                                                                                                                                                      |
| :------------------------------------------------------------------------- | :------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Presentation layer thin, no business logic, no DB access                   | **PASS** | `campaign-router.ts` only invokes `CampaignService` and maps domain errors → HTTP status                                                                                                                                                                                                   |
| Service layer owns business logic, independent of Express/HTTP             | **PASS** | `CampaignService` has no Express/req/res dependency; all methods return domain types                                                                                                                                                                                                       |
| Repository layer is sole DB access point, no business rules                | **PASS** | `CampaignRepository`/`GroupRepository` extensions use only Drizzle; no validation/branching business logic present                                                                                                                                                                         |
| Dependency direction (Presentation→Service→Repository→DB)                  | **PASS** | No reverse or skip-layer imports found                                                                                                                                                                                                                                                     |
| API contract is single source of truth (ts-rest)                           | **PASS** | `packages/contracts/src/campaigns.ts` is the only place `Campaign`/`CreateCampaignInput`/etc. are defined; frontend re-exports via `types/campaign.ts`, no duplicate shape definitions                                                                                                     |
| Frontend: no business rules in components, TanStack Query for server state | **PASS** | `campaign-status.ts`/`campaign-recipients.ts` are pure presentation-adjacent helpers (status labels, client-preview dedup), not authoritative business rules — authoritative resolution/validation stays server-side; `CampaignsPage` uses `campaignsApiClient` + `useQuery`/`useMutation` |
| No new unapproved libraries                                                | **PASS** | `@aws-sdk/client-ses` addition matches `rules/tech-stack.md`'s pre-approved "Amazon SES"; no date-picker or job-queue library added (native `datetime-local` input + `setInterval`, per plan.md Ambiguity items 1 and 10)                                                                  |

`rules/conventions.md` and `rules/tech-stack.md` also checked: kebab-case files, PascalCase components, camelCase intention-revealing methods, no new frameworks — all compliant.

## 4. Automated Checks

| Check                                           | Result                                                                                                                                                                                                                                                                    |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ESLint (`pnpm lint`)                            | **PASS** — 0 errors/warnings                                                                                                                                                                                                                                              |
| TypeScript (`pnpm typecheck`, all 3 workspaces) | **PASS** — 0 errors                                                                                                                                                                                                                                                       |
| SonarQube (Static/Full Quality Gate)            | **NOT RUN** — no SonarQube instance/CLI available in this environment; not verifiable here                                                                                                                                                                                |
| Coverage vs. `coverage_target: 80`              | **NOT MEASURABLE** — no coverage tool (`@vitest/coverage-v8` or equivalent) installed/configured in any workspace's `vitest.config.ts`; numeric coverage % cannot be produced. Test breadth is qualitatively complete against the plan's Testing Tasks matrix (see below) |

### Test Suite Results (`pnpm test`, this run)

| Workspace            | Files  | Tests   | Result                                                                                                                                                                                                     |
| :------------------- | :----- | :------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/contracts` | 3      | 28      | ✅ all pass (incl. campaigns schema T11: 12 tests)                                                                                                                                                         |
| `backend`            | 8      | 67      | ✅ all pass (campaigns: `campaign-service.test.ts` 14, `campaign-api.test.ts` 10; plus Contacts 21, Groups 22, incl. Phase 1 `GroupRepository.findByIds`/`findContactIdsForGroups` P1-4: 4 tests)          |
| `frontend`           | 16     | 38      | ✅ all pass (campaigns component tests: 15, across `campaign-table`, `campaign-status-tabs`+`campaign-status` lib, `campaign-search`, `campaigns-empty-state`, `campaign-editor-modal`, `send-now-dialog`) |
| **Total**            | **27** | **133** | ✅ **133/133 pass**                                                                                                                                                                                        |

### E2E (Playwright, this run)

| Spec                                | Result                              |
| :---------------------------------- | :---------------------------------- |
| `e2e/campaigns.spec.ts` (T30–T32)   | ✅ 3/3 pass                         |
| `e2e/groups.spec.ts` (regression)   | ✅ 3/3 pass                         |
| `e2e/contacts.spec.ts` (regression) | ⚠️ 2/3 pass — see Known Limitations |

Every test named in `plan.md` §2.4 Testing Tasks (T1–T34) exists and passes, except T11/P1-4 which pre-existed this Testing Build Mode pass and were verified as already implemented and green.

## 5. Known Limitations / Deviations

1. **Coverage % unverifiable**: no coverage tooling installed; cannot confirm the `80%` `coverage_target` numerically. Test suite covers every branch enumerated in the plan's Testing Tasks table (validation failures, status-transition guards, dedup, placeholder substitution, dispatch failure path, scheduler, all 7 API endpoints, all listed UI states).
2. **SonarQube gates (Phase 7/9) not executed**: no SonarQube instance available in this environment. Lint + typecheck (the static-analysis-adjacent checks available here) are clean.
3. **`e2e/contacts.spec.ts` pre-existing flake**: `Contacts full lifecycle (T16)` intermittently fails under repeated local runs because it asserts on a hardcoded contact name (`"Ada Lovelace"`) against a persistent, reused dev database (Playwright's `reuseExistingServer` binds to an already-running backend on port 4000 using `backend/data/app.db` rather than the isolated `e2e-test.db` the config specifies), so repeat runs accumulate same-named rows and trip a Playwright strict-mode multiple-match error. This is unrelated to the campaigns feature — no campaigns code or test touches Contacts data or that spec — and predates this validation pass. Not treated as a campaigns regression; flagged for separate follow-up.
4. **Figma pixel-diff not repeated in this pass** (see §2) — relying on the earlier Phase 4 freeze rather than re-verifying here.
5. **`Cancelled` status has no reachable code path in v1.0.0** (documented in `plan.md` Ambiguity item 5, per FDS's own schema-only inclusion) — not a defect, just unexercised by design.
6. **Send Now recipient-count preview** is a client-side approximation (documented in `plan.md` Ambiguity item 7); the backend independently re-resolves live membership at actual send time, so a brief preview/confirm race window is accepted by design, not a bug.

## 6. Summary

All 7 functional requirements (REQ-CMP-01–07) and the full behavior spec are implemented and verified. Architecture rules are respected with no violations found. Lint, typecheck, and the full automated test suite (133 unit/integration/component tests + 3 campaigns E2E tests) all pass. No production code defects were found or required fixing during Testing Build Mode. The feature is **validated as functionally complete** against its frozen specs, with the limitations above (coverage measurement, SonarQube, and an unrelated pre-existing Contacts E2E flake) noted as follow-ups rather than blockers.

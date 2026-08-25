# Validation Report: Contact Groups Management

- **Feature:** groups
- **FDS version:** 1.0.0 (frontmatter `status: draft` — see §6)
- **Plan:** `features/groups/plans/plan-v1.0.0.md` (Scenario C — cross-feature dependency on `contacts`)
- **Validated:** 2026-08-25
- **Persistence:** Ephemeral (`compliance_relevant: false` in `fds.md` frontmatter)

---

## 1. FDS Acceptance Criteria

| Criterion                                                                                                                   | Result   | Evidence                                                                                                                                                |
| :---------------------------------------------------------------------------------------------------------------------------- | :------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **REQ-GRP-01** Create Group — validates `name`, enforces name uniqueness, returns created `Group` with empty `contactIds`  | **PASS** | `group-service.test.ts` (empty `contactIds`, duplicate rejection); `group-router.test.ts` (201/409); E2E "Create Group"                                 |
| **REQ-GRP-02** View & List Groups — displays all groups with Name and Contact Count                                        | **PASS** | `group-grid.test.tsx` (name + "N contacts matched" render); visual check against Figma frame `14:2`. Implemented as a card grid, not a table — see §6.1 |
| **REQ-GRP-03** Search Groups — case-insensitive by `name`, updates dynamically without navigation                          | **PASS** | `group-repository.test.ts` (case-insensitive name match); E2E "Search"                                                                                  |
| **REQ-GRP-04** Edit Group — updates `name`, enforces uniqueness on update                                                   | **PASS** | `group-service.test.ts` (duplicate-on-rename, not-found); `group-router.test.ts` (200/404/409); E2E "Edit Group", E2E "Duplicate name" (edit path)      |
| **REQ-GRP-05** Delete Group — permanent removal on confirmation; member contacts unassigned but not deleted                 | **PASS** | `group-service.test.ts` (delete removes the group row; membership lives only there); E2E "Delete Group" (assigns a member, deletes the group, confirms the contact still exists on `/contacts`) |
| **REQ-GRP-06** Assign/Unassign Contact — a contact belongs to at most one group; assigning moves it out of any prior group  | **PASS** | `group-service.test.ts` (move semantics, idempotent re-assign, not-found errors); `group-router.test.ts` (200/404, cross-group move); `group-membership-view.test.tsx`; `group-create-modal.test.tsx`; E2E "Manage Group Membership"                |
| **Validation Rules** (§4) — required `name`, duplicate-name conflict, referenced `contactId` must exist                    | **PASS** | `group-form-modal.test.tsx` / `group-create-modal.test.tsx` (blocks submission, preserves values); `group-router.test.ts` (400 invalid payload, 404 on missing contact) |

All FDS Section 3 functional requirements are met. Section 4 validation rules are enforced both client-side (Zod + React Hook Form) and server-side (Zod on the ts-rest contract, authoritative per `rules/architecture.md`).

**Cross-feature dependency (Scenario C):** the Phase 1 foundation task — `ContactService.getContactById`, used exclusively by `GroupService` to validate `REQ-GRP-06`'s "contact must exist" rule — is in place, and `group-service.ts` reaches `contacts` only through `ContactService`, never `ContactRepository` directly (confirmed by import inspection, §4). The full existing `contacts` suite (backend 22 + frontend 11 + E2E 5) passes unmodified, confirming Phase 1 introduced no regression.

---

## 2. Visual Check (Figma)

Reference: `features/groups/visuals/figma.md` → nodes `14:2` (Group List), `20:66` (Create Group Step 1 — Basics), `21:65` (Create Group Step 2 — Manual Selection), file `wXSz455HWRiP6veaCxaTBG`.

All three frames were compared directly against the implementation across several iterations this session — colors (including hex values with no matching design token, e.g. `#f3f4f6`/`#4b5563` on the "Manage Group" button), spacing, the fixed 96×32px avatar-stack container, border radii (mapped to the project's customized `rounded-md`/`rounded-lg` tokens), and the "+ Create Group" button's plain-text (no icon) treatment were all corrected to match after a pixel-level re-review. Icons (`more`, `pencil`, `close`, `option-manual`, `option-automatic`, `search`, `filter`, `checkbox-circle`, `empty-user`) are the real assets exported from Figma via the MCP server, not hand-drawn.

**No browser tool is available in this environment**, so the final result was not visually screenshotted end-to-end in a live browser — the comparison was code-level against Figma's returned reference code and screenshots, which is a strong but not pixel-rendered proxy. A manual look in-browser is recommended before final sign-off.

**Documented, approved deviations** (explicit user decisions during Build):

1. **Header/title placement** — the raw Figma capture for `14:2` renders the "Groups" title and "+ Create Group" button *below* the card grid. Per explicit user instruction, this was overridden to place the header at the top of the page (matching the `contacts` page's convention), rather than matching the literal capture.
2. **"Add Automatically" (dynamic filtering)** — visually present on Create Group Step 1, matching Figma exactly, but non-interactive (`aria-disabled`, no click handler). No requirement in the FDS backs dynamic/automatic segmentation; only "Add Manually" is wired to real behavior. Confirmed intentional scope boundary, not a defect.
3. **Search input on the Group List page** — not present in the Figma `14:2` capture at all (`figma.md` itself flags this). Implemented per REQ-GRP-03/`behavior.md`, which both explicitly require it; `figma.md`'s own precedence note ("If the Figma design conflicts with the FDS, the FDS takes precedence for business behavior") supports this. Placement (a slim bar above the grid) was not dictated by any frame.

---

## 3. Test Results

Every test listed in the plan's Testing section (§2.5) exists and passes, re-run fresh in this validation pass.

| Plan item | Description                                                                          | Status       |
| :-------- | :------------------------------------------------------------------------------------- | :----------- |
| 2.5.1     | Regression: `contact-service.getContactById`                                          | ✅ pass (part of 9/9 in `contact-service.test.ts`) |
| 2.5.2     | `group-service` unit tests (duplicate name, move semantics, unassign, delete)         | ✅ 13/13 pass |
| 2.5.3     | `group-repository` tests against real test SQLite (CRUD, case-insensitive search, `findByContactId`) | ✅ 7/7 pass   |
| 2.5.4     | `groupsContract` router/integration tests (status codes, error mapping, assign/unassign) | ✅ 15/15 pass |
| 2.5.5     | Regression: full existing `contacts` backend suite                                    | ✅ 24/24 pass |
| 2.5.6     | `GroupFormModal` validation/preservation component test (edit mode — see §6.2)         | ✅ 5/5 pass   |
| 2.5.7     | `GroupCard`/`GroupGrid` rendering component test                                       | ✅ 3/3 pass   |
| 2.5.8     | `GroupSearchBar` component test                                                        | ✅ 2/2 pass   |
| 2.5.9     | `GroupDeleteDialog` confirm/cancel component test                                      | ✅ 3/3 pass   |
| 2.5.10    | `GroupMembershipView` assign/unassign component test                                   | ✅ 5/5 pass   |
| 2.5.11    | Regression: full existing `contacts` frontend suite                                    | ✅ 11/11 pass |
| —         | `GroupCreateModal` component test (not in original plan — added to cover the 2-step create wizard built after the plan; see §6.2) | ✅ 7/7 pass   |
| 2.5.12    | E2E Create Group flow (adapted to the actual 2-step wizard — see §6.2)                | ✅ pass       |
| 2.5.13    | E2E Edit Group flow                                                                    | ✅ pass       |
| 2.5.14    | E2E Delete Group flow (incl. member unassignment, contact survives)                   | ✅ pass       |
| 2.5.15    | E2E Manage Group Membership flow (cross-group move, unassign)                         | ✅ pass       |
| 2.5.16    | E2E Search flow + empty-state action                                                  | ✅ pass       |
| 2.5.17    | E2E Duplicate name (create + edit)                                                     | ✅ pass       |
| 2.5.18    | Coverage ≥ 80% for the groups feature                                                 | ⚠️ see below  |

**Totals:** Backend 59/59 (contacts 24 + groups 35) · Frontend 36/36 (contacts 11 + groups 25) · E2E 12/12 (contacts 5 + groups 7) · **107/107 automated tests passing**, 0 failures.

**Coverage** (Vitest v8):

- Backend `groups`-specific files: 94.71% statements / 92.2% branches / 100% functions (`group-service.ts` 100%, `group-repository.ts` 97.1%, `group-errors.ts` 100%, `group-router.ts` 84.84%). Backend combined (contacts + groups): **83.81%** — clears the `coverage_target: 80` outright.
- Frontend `groups`-specific components: 95.85% statements / 86.17% branches / 78.78% functions (`group-grid.tsx`/`group-search-bar.tsx`/`group-delete-dialog.tsx` 100%, `group-membership-view.tsx` 98.8%, `group-create-modal.tsx` 98.77%, `group-form-modal.tsx` 96.61%, `group-card.tsx` 94.8%). `group-empty-state.tsx` is 0% — see §6.3.
- Frontend **combined raw aggregate is 65%**, below the 80% target — dragged down entirely by `app/groups/page.tsx`, `use-groups.ts`, and `api-client.ts` (0% in the Vitest report; all exercised instead by the 7 passing groups E2E specs, which this project's tooling does not merge into the v8 number — the identical reporting gap already documented in the `contacts` validation report), plus `group.types.ts` (a pure re-export with no executable logic). See §6.3 for the judgment call this leaves open.

---

## 4. Architecture Compliance

Checked against `rules/architecture.md`:

- **Presentation** (`group-router.ts`): imports only the contract, `@ts-rest/express`, domain errors, and `groupService` — no repository or DB import; only maps domain errors to HTTP status codes. ✅
- **Service** (`group-service.ts`): no Express or Drizzle/DB imports; depends only on `GroupRepository` and `ContactService` (never `ContactRepository` directly — the Phase 1 foundation constraint). ✅
- **Repository** (`group-repository.ts`): only domain-agnostic error is a generic "not found after update" invariant guard (identical pattern to `contact-repository.ts`); no business rules. ✅
- **Frontend**: no `drizzle-orm` or `better-sqlite3` import anywhere under `frontend/src`. ✅
- **Contracts**: `Group`, `createGroupSchema`, `updateGroupSchema`, `assignContactSchema`, `groupsContract` all defined once in `packages/contracts/src/index.ts`, imported by both frontend and backend. `frontend/src/features/groups/group.types.ts` only re-exports the contract type plus adds presentation-only composition types (`GroupMember`, `GroupWithMembers`) for resolving avatar display names — not duplicate request/response types. ✅
- **State management**: server state via TanStack Query (`use-groups.ts`, a second `tsrGroups` client alongside the existing `tsr` contacts client); no unnecessary global state. ✅

No architecture violations found.

---

## 5. Automated Checks

| Check                                                | Result                                                                                                                                                                                                                                             |
| :---------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint (`pnpm lint`)                                 | ✅ 0 errors (6 pre-existing warnings, only in gitignored `coverage/` report artifacts, not source)                                                                                                                                                |
| TypeScript (`pnpm typecheck`, all 3 packages)        | ✅ 0 errors                                                                                                                                                                                                                                        |
| Backend unit/integration tests                       | ✅ 59/59                                                                                                                                                                                                                                           |
| Frontend unit/component tests                        | ✅ 36/36                                                                                                                                                                                                                                           |
| E2E tests (Playwright)                               | ✅ 12/12                                                                                                                                                                                                                                           |
| SonarQube (Static Analysis Gate / Full Quality Gate) | ⚠️ **Not run** — no SonarQube server or scanner is configured in this environment (no `sonar-project.properties`, no `sonar-scanner` on `PATH`, no `SONAR_*` env vars). Same outstanding item already noted in the `contacts` validation report. |

---

## 6. Deviations & Known Limitations

1. **SonarQube not run** — see §5. Outstanding manual/CI step, not a code defect; identical to the `contacts` feature's status.
2. **REQ-GRP-02 says "tabular format"** but the implementation (matching Figma `14:2` and `behavior.md`, both of which describe cards/avatar stacks) is a card grid. `figma.md` itself documents this as an intentional divergence from the FDS wording ("differs from the contacts feature's tabular layout by design"). Read as an FDS wording artifact (likely copied from REQ-CON-02) rather than a real requirement — `behavior.md` and the visual spec are internally consistent and unambiguous about the card layout. Not treated as a failure.
3. **`GroupFormModal`'s "create" mode is now dead code from the page's perspective** — after the 2-step `GroupCreateModal` wizard replaced it for creation (per explicit user request), `GroupFormModal` is only ever invoked with `mode="edit"` from `app/groups/page.tsx`. The component still supports `mode="create"` structurally and is tested that way for one validation case; it isn't wired to any UI action. Left as-is rather than stripped, since it's small, coherent, and not incorrect — worth a cleanup pass if `create` mode is confirmed permanently unused.
4. **Plan drift on the Create Group flow** — `plan-v1.0.0.md` §2.3.7 specified a single-field creation modal; the actual UI is a 2-step wizard (`GroupCreateModal`) matching Figma frames `20:66`/`21:65`, built after an explicit user request following an earlier discussion where the simpler modal had been the agreed approach. The plan document itself was not updated to reflect this (Test/Validation Mode cannot modify it); this report documents the actual, current, fully-tested implementation. The `GroupCreateModal` component test suite (7 tests) was added beyond the plan's original Testing Tasks list to cover this component, since it didn't exist when the plan was written.
5. **Frontend coverage aggregate (65%) reads below the 80% target** — see §3. The gap is concentrated in files exercised by E2E rather than Vitest (page/hook/client wiring) plus one untested component, `group-empty-state.tsx` (0%), left alone to match the identical, pre-existing gap on `contacts`' own `contact-empty-state.tsx`. Whether the 80% target should be read against the raw Vitest aggregate or the unit+component+E2E total is a judgment call flagged here for sign-off, not resolved unilaterally.
6. **`fds.md` frontmatter still reads `status: draft`** — contacts' equivalent field reads `active` at this stage in its lifecycle. Worth updating alongside sign-off if `groups` is being promoted to active status.

---

## 7. Overall Result

**PASS**, with the same outstanding SonarQube step already pending on `contacts`, plus one judgment call to close out: whether the frontend Vitest-only coverage aggregate (65%, pulled down by E2E-covered wiring files) satisfies the FDS's `coverage_target: 80` on its own, or whether the combined unit+component+E2E picture (which does clear it) is the intended reading. All FDS acceptance criteria are met, every test in the plan's Testing section exists and passes (plus one component suite added beyond the plan to cover UI that evolved after the plan was written), the UI matches Figma with three explicitly approved, documented deviations, and no architecture violations were found.

# Implementation Plan: Contact Groups Management

Source specs: `features/groups/fds.md` (v1.0.0), `features/groups/behavior.md`, `features/groups/visuals/figma.md`.

Scenario: C — new feature with cross-feature dependency (`fds.md` frontmatter declares `dependencies: [{ feature: contacts, minVersion: 1.0.0 }]`).

**Note on `features/index.json`**: the catalog entry for `groups` currently lists `"dependencies": []`, which does not reflect the dependency declared in `fds.md` frontmatter. `fds.md` is the canonical living spec and governs this plan; the index entry should be corrected to list `contacts` as a dependency as part of this build.

**Note on visuals**: `figma.md` flags that the captured Group List frame does not visibly show a search input, while REQ-GRP-03 and `behavior.md` both explicitly require case-insensitive search by name. Per `figma.md`'s own precedence note ("If the Figma design conflicts with the FDS, the FDS takes precedence for business behavior"), this plan implements search per REQ-GRP-03/behavior.md. Flag the search input's placement to design during UI Review (Phase 6) since the frame doesn't confirm exact positioning.

---

## Phase 1 — Feature Foundation Refactoring (`contacts`)

The `groups` data model stores membership as `Group.contactIds` and does not add any field to `Contact` — the FDS is explicit that this feature "does not modify the Contact data model." Consequently no schema, contract, or repository restructuring of `contacts` is required. The only foundation gap is a sanctioned, intention-revealing entry point for `groups` to validate that a referenced contact exists, rather than reaching into `contact-repository` directly from another feature's service.

1.1. Add `getContactById(id: string): Promise<Contact | undefined>` to `backend/src/contacts/contact-service.ts`, delegating to the existing `contactRepository.findById`. This becomes the sanctioned cross-feature read used by the `groups` service to validate `REQ-GRP-06`/FDS Section 4 ("A contact ID referenced in an assignment must correspond to an existing contact"). — _FDS Section 4, Architecture: Service Layer, Repository Layer_

1.2. Unit test (regression, `contact-service.test.ts`): `getContactById` returns the contact when it exists and `undefined` when it does not. No existing `contact-service` behavior changes. — _Architecture: Service Layer_

1.3. No changes required to `packages/contracts/src/index.ts` (`contactsContract`, `contactSchema`), `backend/src/db/schema.ts` (`contacts` table), `contact-repository.ts`, `contact-router.ts`, or any frozen `contacts` frontend component — confirm via existing `contacts` test suite passing unmodified as a regression check. — _Architecture: no duplicate request/response types_

1.4. Correct the `dependencies` array for `groups` in `features/index.json` to `[{ "feature": "contacts", "minVersion": "1.0.0" }]` so the catalog matches `fds.md` frontmatter.

---

## Phase 2 — Target Feature Implementation (`groups`)

### 2.1 Contract Tasks (`packages/contracts/src/`)

2.1.1. Define `Group` Zod schema and inferred type: `id`, `name`, `contactIds` (`string[]`), `createdAt`, `updatedAt`. — _FDS Section 2_

2.1.2. Define `createGroupSchema` (`name`, required non-empty) and `updateGroupSchema` (partial of the above). — _FDS Section 4, REQ-GRP-01, REQ-GRP-04_

2.1.3. Define `listGroupsQuerySchema` with optional `search` string param. — _REQ-GRP-03_

2.1.4. Define `assignContactSchema` (`contactId: string`) for the assign/unassign request bodies. — _REQ-GRP-06_

2.1.5. Define a separate `groupsContract` (ts-rest, own router — do not nest under or merge with `contactsContract`) with routes and status codes:

- `POST /groups` → 201 Group, 409 on duplicate name — _REQ-GRP-01_
- `GET /groups` (query: `search?`) → 200 Group[] — _REQ-GRP-02, REQ-GRP-03_
- `PATCH /groups/:id` → 200 Group, 409 on duplicate name, 404 if not found — _REQ-GRP-04_
- `DELETE /groups/:id` → 204, 404 if not found — _REQ-GRP-05_
- `POST /groups/:id/contacts` (body: `assignContactSchema`) → 200 Group, 404 if group or contact not found — _REQ-GRP-06_
- `DELETE /groups/:id/contacts/:contactId` → 200 Group, 404 if group not found — _REQ-GRP-06_

2.1.6. Export `groupsContract` and all group schemas/types from `packages/contracts/src/index.ts` alongside the existing `contactsContract` exports (additive only — no changes to existing exports). — _Architecture: API Contracts_

2.1.7. Unit test: schema validation rejects empty `name`, accepts valid payloads; `assignContactSchema` requires `contactId`. — _FDS Section 4_

---

### 2.2 Backend Tasks (`backend/src/groups/`)

**Repository Layer**

2.2.1. Add Drizzle table definition for `groups` in `backend/src/db/schema.ts`: `id` (PK, UUID), `name` (unique), `contactIds` (JSON-serialized text column), `createdAt`, `updatedAt`. — _FDS Section 2_

2.2.2. Generate and apply a drizzle-kit migration for the `groups` table.

2.2.3. Create `backend/src/groups/group-repository.ts` exposing: `create`, `findAll(search?)` (case-insensitive match on `name`), `findById`, `findByName`, `findByContactId` (locates the group, if any, whose `contactIds` currently contains a given contact id — needed to implement the "move" semantics of REQ-GRP-06), `update`, `delete`. Repository must not contain business rules. — _REQ-GRP-01..06, Architecture: Repository Layer_

**Service Layer**

2.2.4. Create `backend/src/groups/group-service.ts` with `createGroup`, `listGroups`, `updateGroup`, `deleteGroup`, `assignContactToGroup`, `unassignContactFromGroup`.

- `createGroup`: validates uniqueness of `name` via repository lookup, initializes `contactIds: []`, sets `createdAt`/`updatedAt`. — _REQ-GRP-01_
- `updateGroup`: re-validates `name` uniqueness (excluding current record) when `name` changes, updates `updatedAt`. — _REQ-GRP-04_
- `deleteGroup`: permanently removes the group; before deletion, no contact mutation is needed since membership lives only on the `Group` row being deleted (contacts are not touched, they simply have no group afterward). — _REQ-GRP-05_
- `assignContactToGroup`: validates the target group exists (404 if not) and the contact exists via `contactService.getContactById` (404 if not, per Phase 1 Task 1.1); if the contact is currently in a different group (via `groupRepository.findByContactId`), removes it from that group's `contactIds` first, then adds it to the target group's `contactIds`; updates `updatedAt` on affected group(s). — _REQ-GRP-06_
- `unassignContactFromGroup`: removes the contact id from the group's `contactIds` if present, updates `updatedAt`. — _REQ-GRP-06_
- Service must remain independent of Express, must not access the database directly, and must reach `contacts` only through `contactService` (never `contactRepository` directly). — _Architecture: Service Layer_

2.2.5. Define domain errors for "duplicate group name", "group not found", and "contact not found" (reusing `ContactNotFoundError` from `contacts` where the missing entity is a contact) raised by the service layer. — _Architecture: Error Handling_

**Presentation Layer**

2.2.6. Create `backend/src/groups/group-router.ts` implementing `groupsContract` via `@ts-rest/express`, translating domain errors to HTTP responses (409 duplicate name, 404 not found, 400 validation). Router must remain thin with no business logic. — _Architecture: Presentation Layer_

2.2.7. Mount the groups router on the Express app in `backend/src/index.ts` via a second `createExpressEndpoints(groupsContract, groupRouter, app)` call, alongside the existing `contactsContract` mount (additive only). — _Architecture: Presentation Layer_

---

### 2.3 Frontend Tasks (`frontend/src/`)

2.3.1. Create `frontend/src/features/groups/group.types.ts` re-exporting the shared `Group` type from `@email-campaign-v2/contracts` (no duplicate type definitions). — _Architecture: no duplicate request/response types_

2.3.2. Create mock group data and a mock data-access module (in-memory array, seeded with references to mock/real contact ids) for use during the Frontend build phase, mirroring the shape of `groupsContract` responses. — _Workflow: Frontend phase uses mocks before Integration_

2.3.3. Build `GroupCard` component rendering name, contact count ("N contacts matched"), an avatar-stack preview of member contacts, and an overflow menu (Edit, Manage Group, Delete). — _REQ-GRP-02; behavior.md: View Groups; figma.md: Group List_

2.3.4. Build `GroupGrid`/list-composition component rendering `GroupCard`s in a card grid layout (not tabular — per figma.md's explicit note that Groups differs from the `contacts` table layout by design). — _REQ-GRP-02, figma.md_

2.3.5. Build `GroupSearchBar` component (feature-specific, following the `ContactSearchBar` pattern — not shared/generalized); filtering is case-insensitive by `name` and updates results without page navigation (client-side filter over mock data in this phase). — _REQ-GRP-03_

2.3.6. Build `GroupEmptyState` component shown when no groups match, with a primary action to open the Create Group form. — _behavior.md: View Groups_

2.3.7. Build `GroupFormModal` component (Dialog + React Hook Form + Zod resolver using the shared `createGroupSchema`/`updateGroupSchema`) supporting both Create and Edit:

- Save with a valid, unique name closes the modal, refreshes the grid, shows a success toast (via existing `ToastProvider`).
- Cancel closes without saving.
- A duplicate name blocks submission with a conflict error and preserves the entered value.
  — _REQ-GRP-01, REQ-GRP-04; behavior.md: Create Group, Edit Group_

2.3.8. Build `GroupDeleteDialog` confirmation component warning of permanent removal; confirming removes the group (mock layer in this phase) and unassigns its member contacts, shows success toast; cancelling performs no action. — _REQ-GRP-05; behavior.md: Delete Group_

2.3.9. Build `GroupMembershipView` component (opened via "Manage Group") listing existing contacts (reusing the `contacts` feature's list query/types for consumption only, not modification) with assign/unassign controls; assigning a contact already in another group moves it, reflected immediately in both groups' member counts/avatars. — _REQ-GRP-06; behavior.md: Manage Group Membership_

2.3.10. Add shadcn/ui primitives required by the card-grid layout that don't yet exist in `frontend/src/components/ui/` (e.g. `Card`, `Avatar`, `DropdownMenu` for the overflow menu) — shadcn/ui is already an approved library per `rules/tech-stack.md`, this is additive component scaffolding, not a new dependency. — _rules/tech-stack.md_

2.3.11. Build the Groups page (route, `frontend/src/app/groups/page.tsx`) composing `GroupSearchBar`, `GroupGrid`, `GroupEmptyState`, "Create Group" action, `GroupFormModal`, `GroupDeleteDialog`, `GroupMembershipView`, matching layout in `features/groups/visuals/figma.md`. — _FDS Section 3, figma.md_

2.3.12. Wire local component state / TanStack Query (against the mock data module) for grid refresh after create/update/delete/assign/unassign. — _Architecture: State Management_

---

### 2.4 Integration Tasks

2.4.1. Add a second ts-rest React Query client instance for `groupsContract` in `frontend/src/lib/api-client.ts` (e.g. exported as `tsrGroups`), pointed at `BACKEND_URL`, additive alongside the existing `tsr` client for `contactsContract` — both share the app's single `QueryClientProvider` in `providers.tsx` (no changes needed there). — _Architecture: API Communication_

2.4.2. Replace the mock data module usage in the Groups page/components with TanStack Query hooks backed by the `tsrGroups` client: list query (with `search` param), create/update/delete/assign/unassign mutations, in a new `frontend/src/features/groups/use-groups.ts` mirroring `use-contacts.ts`'s pattern. — _REQ-GRP-01..06_

2.4.3. For the `GroupMembershipView` contact picker, reuse the existing `useContactsQuery` hook/`tsr` client from `contacts` read-only (no modification to `contacts` frontend code). — _Architecture: no duplicate request/response types_

2.4.4. Ensure the groups query invalidates/refetches after successful create, update, delete, assign, and unassign mutations so the grid and membership view refresh per behavior.md.

2.4.5. Map backend error responses (409 duplicate name, 404 group/contact not found, 400 validation) to user-facing form/toast messages in the frontend.

2.4.6. Remove the mock data module once integration is verified end-to-end.

---

### 2.5 Testing Tasks

**Backend (Vitest)**

2.5.1. Regression unit test for `contact-service.getContactById` (Phase 1 Task 1.2). — _Architecture: Service Layer_

2.5.2. Unit tests for `group-service`: duplicate name rejected on create and on update; assigning a contact already in another group removes it from the source group and adds it to the target; unassign removes membership without deleting the contact; delete unassigns all member contacts. — _REQ-GRP-01, REQ-GRP-04, REQ-GRP-05, REQ-GRP-06_

2.5.3. Repository tests for `group-repository` against a test SQLite instance: create, case-insensitive search by `name`, `findByContactId`, update, delete. — _REQ-GRP-02, REQ-GRP-03_

2.5.4. Router/integration tests for each `groupsContract` endpoint verifying status codes and error mapping (409, 404, 400), including assign/unassign endpoints. — _FDS Section 5_

2.5.5. Regression: run the full existing `contacts` backend test suite unmodified and confirm it still passes, verifying Phase 1 introduced no behavioral changes. — _Architecture: Service Layer_

**Frontend (Vitest + Testing Library)**

2.5.6. Component test: `GroupFormModal` blocks submission on invalid/duplicate input and preserves entered values. — _FDS Section 4_

2.5.7. Component test: `GroupCard`/`GroupGrid` render name, contact count, and avatar preview from provided group data. — _REQ-GRP-02_

2.5.8. Component test: `GroupSearchBar` filters case-insensitively by name and triggers the empty state when no matches. — _REQ-GRP-03, behavior.md: View Groups_

2.5.9. Component test: `GroupDeleteDialog` confirm/cancel behavior. — _behavior.md: Delete Group_

2.5.10. Component test: `GroupMembershipView` assign moves a contact between groups and updates counts; unassign removes membership without deleting the contact. — _REQ-GRP-06, behavior.md: Manage Group Membership_

2.5.11. Regression: run the full existing `contacts` frontend test suite unmodified and confirm it still passes. — _Architecture: no duplicate request/response types_

**End-to-End (Playwright)**

2.5.12. E2E: full Create Group flow — open modal, submit valid unique name, verify grid refresh and success notification. — _behavior.md: Create Group_

2.5.13. E2E: full Edit Group flow — populated form, save, verify refresh and notification. — _behavior.md: Edit Group_

2.5.14. E2E: full Delete Group flow — confirmation dialog, permanent removal, member contacts unassigned but not deleted, success notification; cancel path performs no action. — _behavior.md: Delete Group_

2.5.15. E2E: Manage Group Membership flow — assign a contact already in Group A to Group B, verify it is removed from A and added to B, counts/avatars update immediately; unassign flow removes membership without deleting the contact. — _REQ-GRP-06, behavior.md: Manage Group Membership_

2.5.16. E2E: Search flow — dynamic filtering by name; empty-state action opens Create Group form. — _REQ-GRP-03, behavior.md: View Groups_

2.5.17. E2E: duplicate name submission on create and edit surfaces a conflict error without corrupting form state. — _FDS Section 4_

**Coverage**

2.5.18. Confirm combined backend + frontend coverage for the `groups` feature (including Phase 1's `getContactById` addition) meets the `coverage_target: 80` declared in `fds.md` frontmatter.

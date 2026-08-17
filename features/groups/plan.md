# Implementation Plan: Groups Management

- **Feature ID**: groups
- **FDS Version**: 1.0.0
- **Source Specs**: `features/groups/fds.md`, `features/groups/behavior.md`, `features/groups/visuals/figma.md`
- **Scenario**: C — New Feature with Cross-Feature Dependency (depends on `contacts` v1.0.0, per FDS frontmatter and `features/index.json`)

---

## 1. Phase 1 — Feature Foundation Refactoring (`contacts`)

Groups must validate and hydrate contact references (`contactIds`, `addContactIds`, `removeContactIds`) without duplicating persistence logic in a new repository (Architecture §"Repository Layer", §"Forbidden Practices" — no duplicated business rules). The existing `ContactRepository` only exposes single-id lookup (`findById`), so a batch lookup is added as a minimal, non-breaking extension.

| #    | Task                                                                                                                                                                                          | Spec Reference                                                      |
| :--- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| P1-1 | Add `ContactRepository.findByIds(ids: string[]): Promise<Contact[]>`, returning only rows that exist and silently ignoring unknown ids.                                                       | Groups FDS §3 (Dependencies), §7 (API Specification)                |
| P1-2 | Update the in-memory `ContactRepository` fake used in `backend/src/contacts/contact-service.test.ts` to implement `findByIds`, so existing Contact unit tests keep passing.                   | Regression safeguard for Contacts FDS (no behavior change intended) |
| P1-3 | Add a unit test asserting `findByIds` returns only matching contacts and excludes unknown ids, with no change to `findAll`, `findById`, `findByEmail`, `create`, `update`, `delete` behavior. | Regression safeguard for Contacts FDS (no behavior change intended) |

This phase touches only `backend/src/contacts/` (repository + its test double). No change to the `Contact` data model, the `contacts` ts-rest contract, or any Contacts frontend/UI code.

---

## 2. Phase 2 — Target Feature Implementation (`groups`)

### 2.1 Frontend Tasks (Mock Data — Phase 3)

| #   | Task                                                                                                                                                                                                              | Spec Reference                       |
| :-- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------- |
| F1  | Create the Groups page route/layout composing the card grid, search, and Create Group action.                                                                                                                     | REQ-GRP-02                           |
| F2  | Define a mock `Group` data module matching the FDS data model (`id`, `name`, `contactCount`, `createdAt`, `updatedAt`) plus mock group-membership associations, to back all frontend tasks until Integration.     | FDS §4                               |
| F3  | Build `GroupCard`/`GroupGrid` components rendering Group Name and Contact Count in a card grid from the mock data.                                                                                                | REQ-GRP-02                           |
| F4  | Build a search input that filters the displayed groups by name, updating results without page navigation.                                                                                                         | REQ-GRP-02, Behavior §"View Groups"  |
| F5  | Build an empty-state view shown when no groups exist, with a primary action to create a group.                                                                                                                    | Behavior §"View Groups"              |
| F6  | Build a "Create Group" trigger that opens a `GroupFormModal` in create mode.                                                                                                                                      | Behavior §"Create Group"             |
| F7  | Build `GroupFormModal` name field with client-side validation (required, non-empty), using React Hook Form + Zod, matching the Create Group Figma frame.                                                          | REQ-GRP-01, FDS §6                   |
| F8  | Build a contact multi-select within `GroupFormModal` allowing contacts to be selected/deselected from the contacts list, preventing the same contact from being selected twice.                                   | REQ-GRP-01, REQ-GRP-03               |
| F9  | Wire modal Save (create mode): create the group in mock data, close the form, refresh the list, and show a success notification; on validation/name-conflict error, block submission and preserve entered values. | Behavior §"Create Group"             |
| F10 | Wire modal Cancel: close the form without persisting changes.                                                                                                                                                     | Behavior §"Create Group"             |
| F11 | Add a "Manage Group" action per card that opens `GroupFormModal` in edit mode, pre-populated with the group's name and current members.                                                                           | REQ-GRP-03, Behavior §"Edit Group"   |
| F12 | Wire Edit Save (rename, add/remove members) and Cancel (discard changes), following the same success/refresh/notification and discard semantics as Create.                                                        | REQ-GRP-03, Behavior §"Edit Group"   |
| F13 | Add a Delete action per card that opens a confirmation dialog stating that only the group record will be removed.                                                                                                 | REQ-GRP-04, Behavior §"Delete Group" |
| F14 | Wire delete confirmation: on confirm, remove the group from mock data (member contacts left untouched) and show a success notification; on cancel, take no action.                                                | REQ-GRP-04, Behavior §"Delete Group" |
| F15 | Reuse the existing shared toast notification component for create/edit/delete feedback (no new notification component).                                                                                           | Behavior §"Create/Edit/Delete Group" |
| F16 | Document all mock data shapes and component-level request/response contracts in `features/groups/presentation-contract.md` ahead of UI Review & Freeze.                                                           | Workflow Phase 3/4 exit criteria     |

---

### 2.2 Backend Tasks (Phase 5 — implements the frozen Presentation Contract)

| #   | Task                                                                                                                                                                                                                                                                                                            | Spec Reference                                                |
| :-- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| B1  | Define the `Group` ts-rest contract in `packages/contracts/src/groups.ts` (resource schema, `CreateGroupInput`, `UpdateGroupInput`, list/search query params) as the shared source of truth.                                                                                                                    | FDS §7, Architecture §"API Contracts"                         |
| B2  | Define Zod validation schemas enforcing a required, non-empty, unique group `name` for create and update inputs.                                                                                                                                                                                                | FDS §6                                                        |
| B3  | Define the Drizzle ORM `groups` table (`id` PK, `name` unique, `createdAt`, `updatedAt`) and a `group_contacts` join table (`groupId` FK → `groups.id`, `contactId` FK → `contacts.id`, composite unique constraint) to persist membership and prevent duplicate contacts within a group at the database layer. | FDS §4, REQ-GRP-01                                            |
| B4  | Implement `GroupRepository` exposing intention-revealing persistence methods: create, findAll (optional name search), findById, findByName, update (rename), addContacts, removeContacts, countContacts, delete (removing only the group and its `group_contacts` rows, never `contacts` rows).                 | Architecture §"Repository Layer", REQ-GRP-04                  |
| B5  | Implement `GroupService.createGroup`: validate the name, enforce name uniqueness via `GroupRepository`, and — for any supplied `contactIds` — validate they exist via `ContactRepository.findByIds` (Phase 1) before associating them, de-duplicating input ids.                                                | REQ-GRP-01                                                    |
| B6  | Implement `GroupService.getGroups`: return all groups with a computed `contactCount`, applying case-insensitive name search when a search query is supplied.                                                                                                                                                    | REQ-GRP-02                                                    |
| B7  | Implement `GroupService.updateGroup`: enforce renamed-name uniqueness excluding the current record; validate `addContactIds` via `ContactRepository.findByIds`; apply add/remove membership changes, ignoring contacts already present or absent respectively.                                                  | REQ-GRP-03                                                    |
| B8  | Implement `GroupService.deleteGroup`: remove the group record and its membership rows only; member contacts are never touched.                                                                                                                                                                                  | REQ-GRP-04                                                    |
| B9  | Implement the Presentation-layer Express/ts-rest router for the groups resource: receive requests, invoke `GroupService` methods, translate domain errors (duplicate name, not found, unknown contact id) into HTTP responses (400/404/409).                                                                    | Architecture §"Presentation Layer", §"Error Handling", FDS §6 |
| B10 | Register the groups router and contract in the backend application bootstrap (`backend/src/index.ts`).                                                                                                                                                                                                          | Architecture §"API Design"                                    |

---

### 2.3 Integration Tasks (Phase 6 — replace mocks with real backend calls)

| #   | Task                                                                                                                                                          | Spec Reference                   |
| :-- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------- |
| I1  | Replace the frontend mock group data source with a TanStack Query hook consuming the ts-rest client `getGroups` (list and search).                            | REQ-GRP-02                       |
| I2  | Wire the create-group mutation (including selected `contactIds`) to the real `createGroup` API call, replacing the mock create path.                          | REQ-GRP-01                       |
| I3  | Wire the edit-group mutation (rename plus `addContactIds`/`removeContactIds`) to the real `updateGroup` API call, replacing the mock update path.             | REQ-GRP-03                       |
| I4  | Wire the delete-group mutation to the real `deleteGroup` API call, replacing the mock delete path.                                                            | REQ-GRP-04                       |
| I5  | Replace the mock contact-selection source in `GroupFormModal` with the existing Contacts feature's `listContacts` ts-rest client/query.                       | FDS §3 (Dependencies)            |
| I6  | Map backend conflict/validation responses (duplicate name, unknown contact id) to inline form validation errors, preserving entered values per behavior spec. | FDS §6, Behavior §"Create Group" |
| I7  | Remove the mock data module (F2) from all production code paths once real calls are verified.                                                                 | Workflow Phase 6 exit criteria   |

---

### 2.4 Testing Tasks (Phase 8 — spec-driven, generated against FDS + behavior spec)

#### Unit Tests

| #   | Task                                                                                                                                                              | Spec Reference             |
| :-- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------- |
| T1  | `GroupService.createGroup` rejects duplicate group names and validates that supplied `contactIds` exist.                                                          | REQ-GRP-01                 |
| T2  | `GroupService.createGroup` prevents duplicate contacts within the created group.                                                                                  | REQ-GRP-01                 |
| T3  | `GroupService.updateGroup` enforces name uniqueness excluding the record being updated.                                                                           | REQ-GRP-03                 |
| T4  | `GroupService.updateGroup` validates `addContactIds` and applies add/remove membership changes correctly.                                                         | REQ-GRP-03                 |
| T5  | `GroupService.deleteGroup` removes the group and its membership rows without deleting member contacts.                                                            | REQ-GRP-04                 |
| T6  | `GroupService.getGroups` performs case-insensitive search by name and returns the correct `contactCount` per group.                                               | REQ-GRP-02                 |
| T7  | Validation schemas reject a missing or empty group name.                                                                                                          | FDS §6                     |
| T8  | (Foundation regression) `ContactRepository.findByIds` returns only matching contacts and excludes unknown ids; existing `ContactService` unit tests remain green. | Phase 1 refactor safeguard |

#### Integration Tests (API)

| #   | Task                                                                                                             | Spec Reference     |
| :-- | :--------------------------------------------------------------------------------------------------------------- | :----------------- |
| T9  | `POST /groups` returns 201 with the created `Group` shape per FDS §7, including `contactCount`.                  | REQ-GRP-01, FDS §7 |
| T10 | `POST /groups` with a duplicate name returns a conflict response.                                                | FDS §6             |
| T11 | `POST /groups` with an unknown `contactId` returns a validation error.                                           | REQ-GRP-01         |
| T12 | `GET /groups` and `GET /groups?search=` return expected result sets.                                             | REQ-GRP-02         |
| T13 | `PATCH /groups/:id` renames, adds, and removes contacts, returning a conflict on duplicate name.                 | REQ-GRP-03         |
| T14 | `DELETE /groups/:id` removes the group and does not alter member contact records (verified via `GET /contacts`). | REQ-GRP-04         |

#### Component Tests (Frontend)

| #   | Task                                                                                                                      | Spec Reference                      |
| :-- | :------------------------------------------------------------------------------------------------------------------------ | :---------------------------------- |
| T15 | `GroupCard`/grid renders Group Name and Contact Count.                                                                    | REQ-GRP-02                          |
| T16 | Search input filters displayed groups by name dynamically, without page navigation.                                       | REQ-GRP-02, Behavior §"View Groups" |
| T17 | Empty state renders with a primary "Create Group" action when no groups exist.                                            | Behavior §"View Groups"             |
| T18 | `GroupFormModal` validation blocks submission on empty/duplicate name and preserves entered values and selected contacts. | Behavior §"Create Group"            |
| T19 | Contact multi-select prevents selecting the same contact twice.                                                           | REQ-GRP-01                          |
| T20 | Delete confirmation dialog: confirm removes the group; cancel takes no action.                                            | Behavior §"Delete Group"            |

#### End-to-End Tests (Playwright)

| #   | Task                                                                                                                                                                                              | Spec Reference                                 |
| :-- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------- |
| T21 | Full lifecycle: create a group with contacts → appears in grid → search finds it → edit renames it and adds/removes contacts → delete removes it, with member contacts still present in Contacts. | REQ-GRP-01, REQ-GRP-02, REQ-GRP-03, REQ-GRP-04 |
| T22 | Attempting to create or rename a group with a duplicate name is rejected end-to-end with a visible error.                                                                                         | FDS §6                                         |

#### Regression Tests

| #   | Task                                                                                                                                                                                           | Spec Reference                     |
| :-- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------- |
| T23 | Existing Contacts suites (`contact-service.test.ts`, `contact-api.test.ts`, `e2e/contacts.spec.ts`) continue to pass unmodified in observable behavior after the Phase 1 `findByIds` addition. | Contacts FDS (dependency), Phase 1 |

---

## 3. Ambiguity & Conflict Report

None blocking. One implementation clarification is recorded (not an ambiguity requiring a stop):

- FDS §4 lists `contactCount` as a field on `Group`, but does not mandate whether it is stored or derived. This plan treats `contactCount` as **computed** from `group_contacts` membership at read time (B4, B6), avoiding a redundant stored counter that could drift from actual membership. This is consistent with FDS §4 (which only specifies the API-visible shape) and does not conflict with `rules/architecture.md` or `rules/conventions.md`.

No conflicts found between the FDS, behavior spec, visual reference, and `rules/architecture.md`, `rules/conventions.md`, or `rules/tech-stack.md`.

# Implementation Plan: Contacts Management

- **Feature ID**: contacts
- **FDS Version**: 1.0.0
- **Source Specs**: `features/contacts/fds.md`, `features/contacts/behavior.md`, `features/contacts/visuals/figma.md`
- **Scenario**: A — New Standalone Feature (no dependencies, no prior plan)

---

## 1. Frontend Tasks (Mock Data — Phase 3)

| #   | Task                                                                                                                                                                                                     | Spec Reference                         |
| :-- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------- |
| F1  | Create the Contacts page route/layout composing the table, search, and Add Contact action.                                                                                                               | REQ-CON-02                             |
| F2  | Define a mock `Contact` data module matching the FDS data model (`id`, `clientId`, `name`, `email`, `branch`, `createdAt`, `updatedAt`) to back all frontend tasks until Integration.                    | FDS §2                                 |
| F3  | Build a `ContactTable` component rendering Client ID, Name, Email, Branch, and Date Added columns from the mock data.                                                                                    | REQ-CON-02                             |
| F4  | Build a search input that filters the displayed contacts case-insensitively by name, email, or branch, updating results without page navigation.                                                         | REQ-CON-03                             |
| F5  | Build an empty-state view shown when the search yields no matches, with a primary action to add a contact.                                                                                               | Behavior §"View Contacts"              |
| F6  | Build an "Add Contact" trigger that opens a `ContactFormModal` in create mode.                                                                                                                           | Behavior §"Create Contact"             |
| F7  | Build `ContactFormModal` fields (name, email, branch) with client-side validation: required fields and email format, using React Hook Form + Zod.                                                        | REQ-CON-01, FDS §4                     |
| F8  | Wire modal Save: on valid submit, create the contact in mock data, close the form, refresh the list, and show a success notification; on validation error, block submission and preserve entered values. | Behavior §"Create Contact"             |
| F9  | Wire modal Cancel: close the form without persisting changes.                                                                                                                                            | Behavior §"Create Contact"             |
| F10 | Add an Edit action per row that opens `ContactFormModal` pre-populated with the selected contact's values.                                                                                               | REQ-CON-04                             |
| F11 | Wire Edit Save/Cancel following the same success/refresh/notification and discard semantics as Create.                                                                                                   | REQ-CON-04, Behavior §"Edit Contact"   |
| F12 | Add a Delete action per row that opens a confirmation dialog warning of permanent removal.                                                                                                               | REQ-CON-05, Behavior §"Delete Contact" |
| F13 | Wire delete confirmation: on confirm, remove the contact from mock data and show a success notification; on cancel, take no action.                                                                      | Behavior §"Delete Contact"             |
| F14 | Build a shared success/error notification (toast) component reused by create, edit, and delete flows.                                                                                                    | Behavior §"Create/Edit/Delete Contact" |
| F15 | Document all mock data shapes and component-level request/response contracts in `features/contacts/presentation-contract.md` ahead of UI Review & Freeze.                                                | Workflow Phase 3/4 exit criteria       |

---

## 2. Backend Tasks (Phase 5 — implements the frozen Presentation Contract)

| #   | Task                                                                                                                                                                                                                     | Spec Reference                                                |
| :-- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| B1  | Define the `Contact` ts-rest contract in `packages/contracts/src` (resource schema, `CreateContactInput`, `UpdateContactInput`, list/search query params) as the shared source of truth.                                 | FDS §5, Architecture §"API Contracts"                         |
| B2  | Define Zod validation schemas enforcing required `name`/`email`/`branch` and valid email format for create and update inputs.                                                                                            | FDS §4                                                        |
| B3  | Define the Drizzle ORM `contacts` table schema: `id` (PK), `clientId` (unique), `name`, `email` (unique), `branch`, `createdAt`, `updatedAt`.                                                                            | FDS §2                                                        |
| B4  | Implement `ContactRepository` exposing intention-revealing persistence methods: create, findAll (with optional search filter), findByEmail, findById, update, delete.                                                    | FDS §2, Architecture §"Repository Layer"                      |
| B5  | Implement `ContactService.createContact`: validate input, generate a unique `clientId` (`LOCAL-<uuid>`), enforce email uniqueness via the repository, return the created `Contact`.                                      | REQ-CON-01                                                    |
| B6  | Implement `ContactService.getContacts`: return all contacts, applying case-insensitive search across name/email/branch when a search query is supplied.                                                                  | REQ-CON-02, REQ-CON-03                                        |
| B7  | Implement `ContactService.updateContact`: validate input, enforce email uniqueness excluding the current record, apply update.                                                                                           | REQ-CON-04                                                    |
| B8  | Implement `ContactService.deleteContact`: permanently remove the contact; confirm no cascading effect on historical campaign records.                                                                                    | REQ-CON-05                                                    |
| B9  | Implement the Presentation-layer Express/ts-rest router for the contacts resource: receive requests, invoke `ContactService` methods, translate domain errors (e.g., duplicate email) into HTTP responses (400/404/409). | Architecture §"Presentation Layer", §"Error Handling", FDS §4 |
| B10 | Register the contacts router and contract in the backend application bootstrap (`backend/src/index.ts`).                                                                                                                 | Architecture §"API Design"                                    |

---

## 3. Integration Tasks (Phase 6 — replace mocks with real backend calls)

| #   | Task                                                                                                                            | Spec Reference                     |
| :-- | :------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------- |
| I1  | Replace the frontend mock data source with a TanStack Query hook consuming the ts-rest client `getContacts` (list and search).  | REQ-CON-02, REQ-CON-03             |
| I2  | Wire the create-contact mutation to the real `createContact` API call, replacing the mock create path.                          | REQ-CON-01                         |
| I3  | Wire the edit-contact mutation to the real `updateContact` API call, replacing the mock update path.                            | REQ-CON-04                         |
| I4  | Wire the delete-contact mutation to the real `deleteContact` API call, replacing the mock delete path.                          | REQ-CON-05                         |
| I5  | Map backend conflict responses (duplicate email) to inline form validation errors, preserving entered values per behavior spec. | FDS §4, Behavior §"Create Contact" |
| I6  | Remove the mock data module (F2) from all production code paths once real calls are verified.                                   | Workflow Phase 6 exit criteria     |

---

## 4. Testing Tasks (Phase 8 — spec-driven, generated against FDS + behavior spec)

### Unit Tests

| #   | Task                                                                                          | Spec Reference |
| :-- | :-------------------------------------------------------------------------------------------- | :------------- |
| T1  | `ContactService.createContact` generates a unique `clientId` and rejects duplicate emails.    | REQ-CON-01     |
| T2  | `ContactService.updateContact` enforces email uniqueness excluding the record being updated.  | REQ-CON-04     |
| T3  | `ContactService.deleteContact` permanently removes the record.                                | REQ-CON-05     |
| T4  | `ContactService.getContacts` performs case-insensitive search across name, email, and branch. | REQ-CON-03     |
| T5  | Validation schemas reject missing required fields and invalid email formats.                  | FDS §4         |

### Integration Tests (API)

| #   | Task                                                                                   | Spec Reference         |
| :-- | :------------------------------------------------------------------------------------- | :--------------------- |
| T6  | `POST /contacts` returns 201 with the created `Contact` shape per FDS §5.              | REQ-CON-01, FDS §5     |
| T7  | `POST /contacts` with a duplicate email returns a conflict response.                   | FDS §4                 |
| T8  | `GET /contacts` and `GET /contacts?search=` return expected result sets.               | REQ-CON-02, REQ-CON-03 |
| T9  | `PATCH /contacts/:id` succeeds and returns a conflict on duplicate email.              | REQ-CON-04             |
| T10 | `DELETE /contacts/:id` removes the record and does not alter historical campaign data. | REQ-CON-05             |

### Component Tests (Frontend)

| #   | Task                                                                                | Spec Reference             |
| :-- | :---------------------------------------------------------------------------------- | :------------------------- |
| T11 | `ContactTable` renders Client ID, Name, Email, Branch, Date Added columns.          | REQ-CON-02                 |
| T12 | Search input filters results dynamically without page navigation.                   | REQ-CON-03                 |
| T13 | Empty state renders with a primary "Add Contact" action when search has no matches. | Behavior §"View Contacts"  |
| T14 | Form validation errors block submission and preserve entered values.                | Behavior §"Create Contact" |
| T15 | Delete confirmation dialog: confirm removes the contact; cancel takes no action.    | Behavior §"Delete Contact" |

### End-to-End Tests (Playwright)

| #   | Task                                                                                                    | Spec Reference                                             |
| :-- | :------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------- |
| T16 | Full lifecycle: create → appears in list → search finds it → edit updates it → delete removes it.       | REQ-CON-01, REQ-CON-02, REQ-CON-03, REQ-CON-04, REQ-CON-05 |
| T17 | Attempting to create/edit a contact with a duplicate email is rejected end-to-end with a visible error. | FDS §4                                                     |

### Regression Tests

Not applicable — this is the initial version (v1.0.0) of the feature; no prior behavior exists to regress against.

---

## 5. Ambiguity & Conflict Report

None found. FDS, behavior spec, and visual reference are internally consistent and do not conflict with `rules/architecture.md`, `rules/conventions.md`, or `rules/tech-stack.md`.

# Implementation Plan: Contacts Management

Source specs: `features/contacts/fds.md` (v1.0.0), `features/contacts/behavior.md`, `features/contacts/visuals/figma.md`.

Scenario: A — new standalone feature, no dependencies.

---

## 1. Contract Tasks (`packages/contracts/src/`)

1.1. Define `Contact` Zod schema and inferred type: `id`, `clientId`, `name`, `email`, `branch`, `createdAt`, `updatedAt`. — _FDS Section 2_

1.2. Define `createContactSchema` (`name`, `email`, `branch`, all required, `email` valid format) and `updateContactSchema` (partial of the above). — _FDS Section 4, REQ-CON-01, REQ-CON-04_

1.3. Define `listContactsQuerySchema` with optional `search` string param. — _REQ-CON-03_

1.4. Define `contactsContract` (ts-rest) with four routes and their request/response schemas and status codes:

- `POST /contacts` → 201 Contact, 409 on duplicate email — _REQ-CON-01_
- `GET /contacts` (query: `search?`) → 200 Contact[] — _REQ-CON-02, REQ-CON-03_
- `PATCH /contacts/:id` → 200 Contact, 409 on duplicate email, 404 if not found — _REQ-CON-04_
- `DELETE /contacts/:id` → 204, 404 if not found — _REQ-CON-05_

1.5. Export `contactsContract` and all contact schemas/types from `packages/contracts/src/index.ts`. — _Architecture: API Contracts_

1.6. Unit test: schema validation rejects empty `name`/`branch`, invalid `email` format, accepts valid payloads. — _FDS Section 4_

---

## 2. Backend Tasks (`backend/src/`)

### Repository Layer

2.1. Add Drizzle table definition for `contacts` in `backend/src/db/schema.ts`: `id` (PK, UUID), `clientId` (unique), `name`, `email` (unique), `branch`, `createdAt`, `updatedAt`. — _FDS Section 2_

2.2. Generate and apply a drizzle-kit migration for the `contacts` table.

2.3. Create `backend/src/contacts/contact-repository.ts` exposing: `create`, `findAll(search?)` (case-insensitive match on `name`/`email`/`branch`), `findById`, `findByEmail`, `update`, `delete`. Repository must not contain business rules. — _REQ-CON-01..05, Architecture: Repository Layer_

### Service Layer

2.4. Create `backend/src/contacts/contact-service.ts` with `createContact`, `listContacts`, `updateContact`, `deleteContact`.

- `createContact`: validates uniqueness of `email` via repository lookup, generates `clientId` as `LOCAL-<uuid>`, sets `createdAt`/`updatedAt`. — _REQ-CON-01_
- `updateContact`: re-validates `email` uniqueness (excluding current record) when `email` changes, updates `updatedAt`. — _REQ-CON-04_
- `deleteContact`: permanently removes the contact; does not touch any campaign records. — _REQ-CON-05_
- Service must remain independent of Express and must not access the database directly. — _Architecture: Service Layer_

2.5. Define domain errors for "duplicate email" and "contact not found" raised by the service layer. — _Architecture: Error Handling_

### Presentation Layer

2.6. Create `backend/src/contacts/contact-router.ts` implementing `contactsContract` via `@ts-rest/express`, translating domain errors to HTTP responses (409 duplicate email, 404 not found, 400 validation). Router must remain thin with no business logic. — _Architecture: Presentation Layer_

2.7. Mount the contacts router on the Express app in `backend/src/index.ts`.

---

## 3. Frontend Tasks (`frontend/src/`)

3.1. Create `frontend/src/features/contacts/contact.types.ts` re-exporting the shared `Contact` type from `@email-campaign-v2/contracts` (no duplicate type definitions). — _Architecture: no duplicate request/response types_

3.2. Create mock contact data and a mock data-access module (in-memory array) for use during the Frontend build phase, mirroring the shape of `contactsContract` responses. — _Workflow: Frontend phase uses mocks before Integration_

3.3. Build `ContactTable` component rendering columns: Client ID, Name, Email, Branch, Date Added. — _REQ-CON-02_

3.4. Build `ContactSearchBar` component; filtering is case-insensitive across `name`, `email`, `branch` and updates results without page navigation (client-side filter over mock data in this phase). — _REQ-CON-03_

3.5. Build `ContactEmptyState` component shown when no contacts match, with a primary action to open the Add Contact form. — _behavior.md: View Contacts_

3.6. Build `ContactFormModal` component (Dialog + React Hook Form + Zod resolver using the shared `createContactSchema`/`updateContactSchema`) supporting both Create and Edit:

- Save with valid data closes the modal, refreshes the list, shows a success toast (via existing `ToastProvider`).
- Cancel closes without saving.
- Validation errors block submission and preserve entered values.
  — _REQ-CON-01, REQ-CON-04; behavior.md: Create Contact, Edit Contact_

3.7. Build `ContactDeleteDialog` confirmation component; confirming removes the contact (mock layer in this phase), shows success toast; cancelling performs no action. — _REQ-CON-05; behavior.md: Delete Contact_

3.8. Build the Contacts page (route) composing `ContactSearchBar`, `ContactTable`, `ContactEmptyState`, "Add Contact" action, `ContactFormModal`, `ContactDeleteDialog`, matching layout in `features/contacts/visuals/figma.md`. — _FDS Section 3, figma.md_

3.9. Wire local component state / TanStack Query (against the mock data module) for list refresh after create/update/delete. — _Architecture: State Management_

---

## 4. Integration Tasks

4.1. Generate the ts-rest React Query client for `contactsContract` in the frontend (extending `frontend/src/lib/api-client.ts`), pointed at `BACKEND_URL`.

4.2. Replace the mock data module usage in the Contacts page/components with TanStack Query hooks backed by the ts-rest client: list query (with `search` param), create/update/delete mutations. — _REQ-CON-01..05_

4.3. Ensure list query invalidates/refetches after successful create, update, and delete mutations so the table refreshes per behavior.md.

4.4. Map backend error responses (409 duplicate email, 404 not found, 400 validation) to user-facing form/toast messages in the frontend.

4.5. Remove the mock data module once integration is verified end-to-end.

---

## 5. Testing Tasks

### Backend (Vitest)

5.1. Unit tests for `contact-service`: duplicate email rejected on create and on update; `clientId` generated in `LOCAL-<uuid>` format; delete does not affect unrelated records. — _REQ-CON-01, REQ-CON-04, REQ-CON-05_

5.2. Repository tests for `contact-repository` against a test SQLite instance: create, case-insensitive search across `name`/`email`/`branch`, update, delete. — _REQ-CON-02, REQ-CON-03_

5.3. Router/integration tests for each `contactsContract` endpoint verifying status codes and error mapping (409, 404, 400). — _FDS Section 5_

### Frontend (Vitest + Testing Library)

5.4. Component test: `ContactFormModal` blocks submission on invalid input and preserves entered values. — _FDS Section 4_

5.5. Component test: `ContactTable` renders all required columns from provided contact data. — _REQ-CON-02_

5.6. Component test: `ContactSearchBar` filters case-insensitively and triggers the empty state when no matches. — _REQ-CON-03, behavior.md: View Contacts_

5.7. Component test: `ContactDeleteDialog` confirm/cancel behavior. — _behavior.md: Delete Contact_

### End-to-End (Playwright)

5.8. E2E: full Create Contact flow — open modal, submit valid data, verify list refresh and success notification. — _behavior.md: Create Contact_

5.9. E2E: full Edit Contact flow — populated form, save, verify refresh and notification. — _behavior.md: Edit Contact_

5.10. E2E: full Delete Contact flow — confirmation dialog, permanent removal, success notification; cancel path performs no action. — _behavior.md: Delete Contact_

5.11. E2E: Search flow — dynamic filtering by name/email/branch; empty-state action opens Add Contact form. — _REQ-CON-03, behavior.md: View Contacts_

5.12. E2E: duplicate email submission on create and edit surfaces a conflict error without corrupting form state. — _FDS Section 4_

### Coverage

5.13. Confirm combined backend + frontend coverage for the `contacts` feature meets the `coverage_target: 80` declared in `fds.md` frontmatter.

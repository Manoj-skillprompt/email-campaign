# Implementation Plan: Contacts Management (v1.1.0)

Source specs: `features/contacts/fds.md` (v1.1.0), `features/contacts/behavior.md`.

Scenario: B — existing feature update (in-place living spec).

Scope: this update covers only the `1.1.0` changelog entry — **server-side pagination for the Contacts list** (`REQ-CON-06`), the related `REQ-CON-03` search/pagination interaction, and the new `page`/`pageSize` validation rules. The Group column wording trim in `REQ-CON-02` is documentation-only (confirmed with the developer): no functional change to `ContactTable`'s existing Group column or to the client-side `groupLabel` derivation in `app/contacts/page.tsx` — no tasks are included for it.

The `contacts` feature is already built and integrated (v1.0.0), so this plan modifies the live contract/backend/frontend directly rather than reintroducing a mock-first phase.

---

## 1. Contract Tasks (`packages/contracts/src/`)

1.1. Extend `listContactsQuerySchema` with `page` (optional, coerced to positive integer, default `1`) and `pageSize` (optional, coerced to integer between `1` and `100`, default `10`); reject non-positive/non-integer `page` and out-of-range `pageSize` at the schema level. — _REQ-CON-06, FDS Section 4_

1.2. Define `paginatedContactsSchema` (and inferred `PaginatedContacts` type) with fields `data: Contact[]`, `page: number`, `pageSize: number`, `total: number`, `totalPages: number`. — _FDS Section 5_

1.3. Update `contactsContract.listContacts` response from `200: z.array(contactSchema)` to `200: paginatedContactsSchema`; add `400: errorResponseSchema` for invalid `page`/`pageSize`. — _REQ-CON-06_

1.4. Export `paginatedContactsSchema`/`PaginatedContacts` from `packages/contracts/src/index.ts` alongside the existing contact exports. — _Architecture: API Contracts_

1.5. Unit test: `listContactsQuerySchema` rejects `page <= 0`, non-integer `page`, `pageSize < 1`, `pageSize > 100`; accepts valid/omitted values with defaults applied. — _FDS Section 4_

---

## 2. Backend Tasks (`backend/src/contacts/`)

### Repository Layer

2.1. Update `ContactRepository.findAll` to accept `{ search?: string; page: number; pageSize: number }`, apply the existing case-insensitive `search` filter first, then apply `LIMIT`/`OFFSET` pagination, and return `{ data: Contact[]; total: number }` (`total` = count of matching rows before pagination, via a `count(*)` query reusing the same search predicate). — _REQ-CON-06, REQ-CON-03 (pagination applied after search filtering)_

2.2. Requesting a `page` beyond the computed `totalPages` must resolve to an empty `data` array from the repository, not throw. — _REQ-CON-06_

### Service Layer

2.3. Update `ContactService.listContacts` to accept `{ search?: string; page?: number; pageSize?: number }`, apply schema defaults (`page = 1`, `pageSize = 10`), call the updated repository method, and compute `totalPages = Math.ceil(total / pageSize)` (treat `total === 0` as `totalPages = 0`). Return the `PaginatedContacts` envelope. — _REQ-CON-06_

### Presentation Layer

2.4. Update `contact-router.ts`'s `listContacts` handler to pass `query.page`/`query.pageSize` through to the service and return the paginated envelope as the `200` body. Invalid `page`/`pageSize` are already rejected by the ts-rest/Zod query schema (task 1.1) before reaching the handler — no additional validation logic needed in the router. — _Architecture: Presentation Layer, REQ-CON-06_

---

## 3. Frontend Tasks (`frontend/src/features/contacts/`, `frontend/src/app/contacts/`)

3.1. Update `use-contacts.ts`'s `useContactsQuery` to accept `{ search: string; page: number; pageSize?: number }`, include `page` (and `pageSize` if non-default) in the TanStack Query `queryKey`, and pass them as query params to `tsr.listContacts`. — _REQ-CON-06_

3.2. Build a `ContactPagination` component (`frontend/src/features/contacts/components/contact-pagination.tsx`) rendering previous/next controls and a "Page X of Y" indicator; previous is disabled on page `1`, next is disabled on the last page; the component renders nothing when `totalPages <= 1`. — _REQ-CON-06_

3.3. Update `app/contacts/page.tsx`:

- Add `page` state (default `1`); reset it to `1` whenever `search` changes. — _REQ-CON-03_
- Pass `page` to `useContactsQuery`; read `data`, `total`, `page`, `totalPages` from the paginated response body (`contactsQuery.data?.body`).
- Derive `contactsWithGroup` from the current page's `data` array (existing groupLabel join logic unchanged).
- Replace the `{contacts.length} total contacts found` header text with the envelope's `total`.
- Render `ContactPagination` below `ContactTable`, wired to `page`/`totalPages` and a page-change handler.
  — _REQ-CON-02, REQ-CON-06_

---

## 4. Testing Tasks

### Backend (Vitest)

4.1. Repository test: `findAll` returns the correct page slice and `total` for combinations of `search` + `page`/`pageSize`; a `page` beyond `totalPages` returns an empty `data` array with the correct `total`. — _REQ-CON-06_

4.2. Service test: `listContacts` applies default `page`/`pageSize`, computes `totalPages` correctly (including `total = 0` → `totalPages = 0`), and passes pagination params through to the repository unchanged when explicitly provided. — _REQ-CON-06_

4.3. Router/integration test: `GET /contacts` returns the `PaginatedContacts` envelope shape; invalid `page` (`0`, negative, non-integer) and invalid `pageSize` (`0`, `101`, non-integer) return `400`; pagination combined with `search` reflects the filtered total. — _FDS Section 4, FDS Section 5_

4.4. Regression: re-run `contact-router.test.ts` create/update/delete assertions to confirm they are unaffected by the `listContacts` response shape change (existing tests currently only assert array bodies from other endpoints — update any assertion that reads `listContacts`'s body as a bare array). — _REQ-CON-01, REQ-CON-04, REQ-CON-05_

4.5. Regression: confirm `group-router.test.ts` and `campaign-router.test.ts`, which mount `contactsContract`/`contactRouter` to seed fixture contacts via `createContact`, still pass unchanged (they do not assert on `listContacts`'s response shape). — _Architecture: no duplicate request/response types_

### Frontend (Vitest + Testing Library)

4.6. Component test: `ContactPagination` — prev/next disabled states at boundaries, correct "Page X of Y" text, renders nothing when `totalPages <= 1`. — _REQ-CON-06_

4.7. Update/extend page-level test coverage: changing the search term resets `page` to `1`; the "X total contacts found" header reflects the envelope's `total`, not the current page's row count. — _REQ-CON-03_

4.8. Regression: existing `contact-table.test.tsx`, `contact-search-bar.test.tsx`, `contact-form-modal.test.tsx`, `contact-delete-dialog.test.tsx` continue to pass against page-sliced `data` rather than the full contact list. — _REQ-CON-01, REQ-CON-02, REQ-CON-04, REQ-CON-05_

### End-to-End (Playwright)

4.9. E2E: pagination flow — seed more than one page of contacts, verify next/previous navigation, current-page indicator text, and that controls are hidden when the result set fits on one page. — _REQ-CON-06_

4.10. E2E: search resets pagination — navigate to page 2+, enter a search term, verify the view returns to page 1 and pagination metadata reflects the filtered set. — _REQ-CON-03_

4.11. Regression: existing Create/Edit/Delete/Search E2E flows (behavior.md) still pass with the paginated list response. — _behavior.md: Create Contact, Edit Contact, Delete Contact, View Contacts_

### Coverage

4.12. Confirm combined backend + frontend coverage for the `contacts` feature still meets the `coverage_target: 80` declared in `fds.md` frontmatter after this change.

# Presentation Contract: Contacts Management

- **Feature ID**: contacts
- **Generated**: Frontend Build Mode (Phase 3), pending UI Review & Freeze (Phase 4)
- **Status**: Draft — becomes authoritative for Backend Build Mode once frozen

This document records the mock data shapes and component-level request/response contracts
implemented against `features/contacts/fds.md` and `features/contacts/behavior.md` using mock
data. Once frozen, Backend Build Mode (Phase 5) must satisfy these shapes exactly via the
`packages/contracts` ts-rest contract.

---

## 1. Data Shape — `Contact`

Matches FDS §2 exactly; implemented at `frontend/src/types/contact.ts`.

| Field       | Type     | Notes                                  |
| :---------- | :------- | :------------------------------------- |
| `id`        | `string` | UUID, primary key                      |
| `clientId`  | `string` | Unique, format `LOCAL-<uuid-fragment>` |
| `name`      | `string` | Required, non-empty                    |
| `email`     | `string` | Required, valid email, unique          |
| `branch`    | `string` | Required, non-empty                    |
| `createdAt` | `string` | ISO 8601 timestamp                     |
| `updatedAt` | `string` | ISO 8601 timestamp                     |

## 2. Request Shapes

- `CreateContactInput`: `{ name: string; email: string; branch: string }`
- `UpdateContactInput`: `Partial<CreateContactInput>`

Client-side validation (`frontend/src/lib/validation/contact-schema.ts`, Zod):

- `name`: required, trimmed, min length 1.
- `email`: required, trimmed, valid email format, unique (case-insensitive) against all other
  contacts currently loaded — mirrors FDS §4. In edit mode, the contact's own current email is
  excluded from the uniqueness check.
- `branch`: required, trimmed, min length 1.

## 3. Mock Data Source

`frontend/src/lib/mock-contacts.ts` exports `INITIAL_MOCK_CONTACTS`: 6 seed contacts matching
the `Contact` shape above. The Contacts page (`frontend/src/app/contacts/page.tsx`) holds this
list in local component state and performs create/update/delete against it in memory. This will
be replaced by TanStack Query + ts-rest client calls in Integration Build Mode (Phase 6, plan
tasks I1–I6).

## 4. Component Contracts

### `ContactTable`

- **Props**: `{ contacts: Contact[]; onEdit: (contact: Contact) => void; onDelete: (contact: Contact) => void }`
- **Renders**: Client ID, Name (with avatar initial), Email, Branch, Date Added, and Edit/Delete
  actions per row. Date Added is `createdAt` formatted via `toLocaleDateString('en-US')`.

### `ContactSearch`

- **Props**: `{ value: string; onChange: (value: string) => void }`
- **Behavior**: Controlled text input; parent filters `contacts` client-side, case-insensitively
  across `name`, `email`, `branch`, on every keystroke (no navigation).

### `ContactsEmptyState`

- **Props**: `{ onAddContact: () => void }`
- **Shown when**: the filtered contact list is empty (no search matches).

### `ContactFormModal`

- **Props**: `{ open: boolean; onOpenChange: (open: boolean) => void; mode: 'create' | 'edit'; contact?: Contact; existingEmails: Set<string>; onSubmit: (values: ContactFormValues) => void }`
- **Behavior**: Renders Name/Email/Branch fields. On valid submit, calls `onSubmit` then closes.
  On validation failure, blocks submission and preserves entered values (React Hook Form
  default). Cancel closes without calling `onSubmit`.

### `DeleteContactDialog`

- **Props**: `{ contact: Contact | null; onOpenChange: (open: boolean) => void; onConfirm: (contact: Contact) => void }`
- **Behavior**: Open when `contact` is non-null. Confirm calls `onConfirm` and closes; Cancel
  closes without calling `onConfirm`.

### Toast notifications (`useToast`)

- `showToast(message, variant?)` — global toast surfaced on successful create, update, and
  delete, per Behavior spec success-notification requirements.

## 5. Scope Exclusions (Figma vs. FDS precedence)

The Figma reference frame (`features/contacts/visuals/figma.md`) additionally depicts a Group
column, a Group filter dropdown ("All Groups"), row checkboxes, and an info-icon button. None of
these appear in `fds.md` or `behavior.md`, and `figma.md` §Notes states the FDS takes precedence
for business behavior on conflict. These elements were intentionally excluded from this
implementation. If Groups become an in-scope requirement, this must go through a new FDS version
per `rules/workflow.md` §4 (Extension), not be added silently during Build Mode.

## 6. Visual Fidelity Notes

Implemented against Figma node `6:2` (`https://www.figma.com/design/wXSz455HWRiP6veaCxaTBG/email-campaign?node-id=6-2`):
page header, primary Add Contact button, search input, and data table layout/spacing/typography
match the reference. Icons (search, mail, location/branch, edit, delete, plus) are the exact
exported Figma SVG assets, committed at `frontend/public/icons/`.

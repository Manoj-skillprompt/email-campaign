# Presentation Contract: Groups Management

- **Feature ID**: groups
- **Generated**: Frontend Build Mode (Phase 3), pending UI Review & Freeze (Phase 4)
- **Status**: Draft — becomes authoritative for Backend Build Mode once frozen

This document records the mock data shapes and component-level request/response contracts
implemented against `features/groups/fds.md` and `features/groups/behavior.md` using mock data.
Once frozen, Backend Build Mode (Phase 5) must satisfy these shapes exactly via the
`packages/contracts` ts-rest contract (plan tasks B1–B10).

---

## 1. Data Shape — `Group`

Matches FDS §4. Implemented at `frontend/src/types/group.ts` (local mock-phase type; will be
replaced by a re-export from `@email-campaign-v2/contracts` once `groupsContract` exists —
plan task I7).

| Field          | Type     | Notes                                                   |
| :------------- | :------- | :------------------------------------------------------ |
| `id`           | `string` | UUID, primary key                                       |
| `name`         | `string` | Required, non-empty, unique                             |
| `contactCount` | `number` | **Computed**, not stored — see plan.md §3 clarification |
| `createdAt`    | `string` | ISO 8601 timestamp                                      |
| `updatedAt`    | `string` | ISO 8601 timestamp                                      |

## 2. Request Shapes

- `CreateGroupInput`: `{ name: string; contactIds?: string[] }`
- `UpdateGroupInput`: `{ name?: string; addContactIds?: string[]; removeContactIds?: string[] }`

The frontend form (`GroupFormModal`) collects a single combined shape, `GroupFormValues`
(`frontend/src/lib/validation/group-schema.ts`, Zod):

- `name`: required, trimmed, min length 1, unique (case-insensitive) against all other groups
  currently loaded — mirrors FDS §6. In edit mode, the group's own current name is excluded from
  the uniqueness check.
- `contactIds`: `string[]` — the full desired membership set. On save, the page computes the
  add/remove diff against current membership before calling `onSubmit`'s backing update path (in
  the mock phase, membership is simply replaced wholesale; Integration Build Mode (I3) must map
  this to `addContactIds`/`removeContactIds` against the real `updateGroup` API).

## 3. Mock Data Source

`frontend/src/lib/mock-groups.ts` exports:

- `mockContacts`: 7 seed `Contact` records (matching the existing Contacts feature's shape) used
  to back the contact multi-select until Integration Build Mode replaces it with the real
  `listContacts` query (plan task I5).
- `initialGroupSeeds`: 3 seed groups (`id`, `name`, `createdAt`, `updatedAt` — no `contactCount`).
- `initialGroupMembership`: `Record<groupId, contactId[]>` seeding each group's members.

The Groups page (`frontend/src/app/groups/page.tsx`) holds seeds + membership in local component
state, derives `Group[]` (with `contactCount` computed from membership length) on render, and
performs create/update/delete against this state in memory. This will be replaced by TanStack
Query + ts-rest client calls in Integration Build Mode (Phase 6, plan tasks I1–I4).

## 4. Component Contracts

### `GroupGrid` / `GroupCard`

- **Props** (`GroupGrid`): `{ groups: Group[]; membersByGroupId: Record<string, Contact[]>; onManage: (group: Group) => void; onDelete: (group: Group) => void }`
- **Props** (`GroupCard`): `{ group: Group; members: Contact[]; onManage: (group: Group) => void; onDelete: (group: Group) => void }`
- **Renders**: group name, `"{contactCount} contacts matched"`, up to 4 member avatars
  (illustrative preview, not an exhaustive list — matches Figma's fixed 4-avatar stack regardless
  of `contactCount`), a "Manage Group" action (opens edit mode), and a "More options" menu whose
  only item is "Delete Group".

### `GroupSearch`

- **Props**: `{ value: string; onChange: (value: string) => void }`
- **Behavior**: Controlled text input; parent filters `groups` client-side, case-insensitively by
  `name`, on every keystroke (no navigation).

### `GroupsEmptyState`

- **Props**: `{ onCreateGroup: () => void }`
- **Shown when**: the filtered group list is empty (no search matches, or no groups exist).

### `GroupFormModal`

- **Props**: `{ open: boolean; onOpenChange: (open: boolean) => void; mode: 'create' | 'edit'; group?: Group; currentMemberIds: string[]; allContacts: Contact[]; existingNames: Set<string>; onSubmit: (values: GroupFormValues) => Promise<void> }`
- **Behavior**: Single-step form — Group Name field plus a searchable, checkbox-based contact
  multi-select (see §5 for why this is single-step rather than the Figma wizard). On valid
  submit, calls `onSubmit` then closes. On validation failure (empty/duplicate name), blocks
  submission and preserves entered values and current selection (React Hook Form default).
  Cancel closes without calling `onSubmit`.

### `DeleteGroupDialog`

- **Props**: `{ group: Group | null; onOpenChange: (open: boolean) => void; onConfirm: (group: Group) => void }`
- **Behavior**: Open when `group` is non-null. Confirmation text explicitly states member
  contacts are not affected (REQ-GRP-04). Confirm calls `onConfirm` and closes; Cancel closes
  without calling `onConfirm`.

### Toast notifications (`useToast`)

- Reuses the existing shared `useToast` provider from the Contacts feature — no new notification
  component was introduced (plan task F15). `showToast(message, variant?)` is surfaced on
  successful create, update, and delete.

## 5. Scope Exclusions (Figma vs. FDS conflict — resolved during Build Mode)

Pulling the actual Figma design context (not just the links in `visuals/figma.md`) during Build
Mode surfaced a material conflict not caught during Plan Mode:

- The "Create Group" Figma frame (nodes `20:66` / `21:65`) is a **two-step wizard**: Step 1
  ("Basics") asks the user to choose an **Assignment Type** — "Add Manually" (matches the FDS) or
  **"Add Automatically"** ("Define dynamic filtering conditions") — before a Step 2 two-column
  drag-and-drop contact picker.
- `fds.md` §4 (data model), §7 (API spec), and `behavior.md` have **no representation of dynamic
  / automatic (filter-based) group membership** anywhere. There is also no separate "Edit Group"
  frame — "Manage Group" appears to reuse the same wizard.

**Resolution (developer decision, communicated in chat during Build Mode)**: FDS wins. This
implementation builds only the manual-selection path as a **single-step modal** — no wizard, no
"Assignment Type" choice, no dynamic/automatic group type. The dynamic-filter concept from the
Figma frame is out of scope for this version. If automatic/dynamic groups become an in-scope
requirement, that must go through a new FDS version per `rules/workflow.md` §4 (Extension), not
be added silently during Build Mode.

Additionally, the actual "Groups Management" list frame (`14:2`) does not depict a search input,
even though FDS §"REQ-GRP-02" and `behavior.md` §"View Groups" both require one. This is treated
as a documentation gap in the mockup (Clarification, not a Contradiction) — the search bar is
implemented as specified in the FDS/behavior spec.

The Figma Step 2 picker's drag-and-drop interaction and circular checkbox glyphs were not
reproduced pixel-for-pixel; the multi-select uses a searchable checklist (native checkboxes)
consistent with `rules/tech-stack.md` (no new drag-and-drop dependency) and with how the FDS
describes selection ("select zero or more contacts") rather than drag-and-drop assignment.

## 6. Visual Fidelity Notes

Implemented against Figma node `14:2`
(`https://www.figma.com/design/wXSz455HWRiP6veaCxaTBG/email-campaign?node-id=14-2`): page header,
"+ Create Group" button (plain text, no icon, matching the frame exactly), and the group card
layout (name, "N contacts matched", avatar stack colors `#007bff`/`#4f46e5`/`#10b981`/`#f59e0b`,
"Manage Group" button) match the reference. The "More options" and "Manage Group" pencil icons
are the exact exported Figma SVG assets, committed at `frontend/public/icons/more.svg` and
`frontend/public/icons/pencil.svg`. The Group Name input's label and placeholder text
("e.g. Sydney Visa Pending Clients") in `GroupFormModal` match Figma node `20:82`/`20:83` from the
Step 1 panel. Per §5, the wizard framing, Assignment Type step, and Step 2 drag-and-drop layout
were intentionally not reproduced.

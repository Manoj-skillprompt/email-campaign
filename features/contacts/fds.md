---
id: contacts
title: Contacts Management
status: active
version: 1.2.0
owner: contacts-team
last_updated: 2026-08-07
changelog:
  - version: 1.2.0
    date: 2026-08-07
    pr: "#007"
    summary: Bug-fix pass — Group badge now reflects real membership (REQ-CON-02), and contact deletion keeps group membership consistent on both sides (REQ-CON-05)
  - version: 1.1.0
    date: 2026-08-07
    pr: "#004"
    summary: Redesigned Contacts UI layout based on new visual design spec & Figma reference
  - version: 1.0.0
    date: 2026-08-06
    pr: "#001"
    summary: Initial specification for Contacts management
---

# Feature Specification: Contacts Management

## 1. Overview

Provide capability to manage individual client contacts within the internal application.

## 2. Visual & UI Specification
- Authoritative Figma Frame: [`features/contacts/visuals/figma.md`](file:///home/sujal/programming/work/email-campaign/features/contacts/visuals/figma.md) (Node ID: `6-2`)
- Visual Mockups & Spec: [`features/contacts/visuals/visual-spec.md`](file:///home/sujal/programming/work/email-campaign/features/contacts/visuals/visual-spec.md) and [`features/contacts/visuals/contacts-design.png`](file:///home/sujal/programming/work/email-campaign/features/contacts/visuals/contacts-design.png).

## 3. Data Model (`Contact`)

- `id`: string (UUID, Primary Key)
- `clientId`: string (Unique, auto-generated, e.g. `LOCAL-<uuid>`)
- `name`: string (Required, non-empty)
- `email`: string (Required, valid format, Unique)
- `branch`: string (Required, non-empty)
- `createdAt`: string (ISO Timestamp)
- `updatedAt`: string (ISO Timestamp)

## 4. Functional Requirements

### REQ-CON-01: Create Contact
- Must validate `name`, `email`, and `branch`.
- Email address must be unique across all contacts.
- System automatically generates a unique `clientId` (e.g. `LOCAL-<uuid>`).
- Returns the created `Contact` object.

### REQ-CON-02: View & List Contacts (UI Redesign)
- Displays contacts in modern table layout matching Figma Node `6-2` (`visuals/contacts-design.png`):
  - Total count subtitle under header (`X total contacts found`).
  - Table columns: Checkbox, Client ID (`#` prefix in blue text), Name (initial badge + bold name), Email (mail icon + email), Branch (map pin + location), Group (pill badge), Date Added, Actions (Edit/Delete).
- The Group pill badge MUST reflect the contact's real, current group membership (not a placeholder) — `-` only when the contact belongs to zero groups.
- A contact may belong to more than one group. The badge displays the first group name; if the contact belongs to additional groups, append a `+N` indicator (e.g. `VIP Clients +2`).

### REQ-CON-03: Search & Group Filtering
- Supports case-insensitive searching by `name`, `email`, or `branch`.
- Supports filtering by Group dropdown ("All Groups").

### REQ-CON-04: Edit Contact
- Allows updating existing contact details (`name`, `email`, `branch`).
- Enforces email uniqueness validation on update.

### REQ-CON-05: Delete Contact
- Permanently removes contact from the database upon user confirmation.
- Deleting a contact automatically removes it from every group it belongs to. This MUST be consistent on both sides of the relationship: the deleted contact is dropped from each group's member set, so affected groups' contact counts and member previews stay accurate immediately after deletion — not just the contact's own group associations.
- Deleting a contact does NOT alter historical sent campaigns.

## 5. Validation Rules

- Required fields: Name, Email, Branch.
- Email must be a valid email format (`user@domain.com`).
- Duplicate emails are rejected with conflict error.

## 6. API / Interface Specification

- `createContact(data: { name: string; email: string; branch: string }): Promise<Contact>`
- `getContacts(query?: { search?: string; groupId?: string }): Promise<Contact[]>`
- `updateContact(id: string, data: Partial<CreateContactInput>): Promise<Contact>`
- `deleteContact(id: string): Promise<void>`

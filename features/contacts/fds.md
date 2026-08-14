---
id: contacts
title: Contacts Management
status: active
version: 1.0.0
owner: contacts-team
last_updated: 2026-08-14
changelog:
  - version: 1.0.0
    date: 2026-08-14
    summary: Initial specification for Contacts management (email-campaign-v2)
---

# Feature Specification: Contacts Management

## 1. Overview

Provide capability to manage individual client contacts within the internal application.

## 2. Visual & UI Specification

- Authoritative Figma Frame: [`features/contacts/visuals/figma.md`](features/contacts/visuals/figma.md) (Node ID: `6-2`)

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

### REQ-CON-02: View & List Contacts

- Displays contacts in a table layout matching the Figma design (Node ID: `6-2`).
- Table columns: Client ID (`#` prefix), Name, Email, Branch, Date Added, Actions (Edit / Delete).
- Shows total contact count subtitle (`X total contacts found`).

### REQ-CON-03: Search Contacts

- Supports case-insensitive searching by `name`, `email`, or `branch`.
- When no contacts match the search, display an empty state.

### REQ-CON-04: Edit Contact

- Allows updating existing contact details (`name`, `email`, `branch`).
- Enforces email uniqueness validation on update.

### REQ-CON-05: Delete Contact

- Permanently removes contact from the database upon user confirmation.
- Deleting a contact does NOT alter historical sent campaigns.

## 5. Validation Rules

- Required fields: Name, Email, Branch.
- Email must be a valid email format (`user@domain.com`).
- Duplicate emails are rejected with a conflict error.

## 6. API / Interface Specification

- `createContact(data: { name: string; email: string; branch: string }): Promise<Contact>`
- `getContacts(query?: { search?: string }): Promise<Contact[]>`
- `updateContact(id: string, data: Partial<CreateContactInput>): Promise<Contact>`
- `deleteContact(id: string): Promise<void>`

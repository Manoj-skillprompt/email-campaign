---
id: contacts
title: Contacts Management
status: active
version: 1.1.0
owner: contacts-team
last_updated: 2026-08-27
coverage_target: 80
compliance_relevant: false
dependencies: []
changelog:
  - version: 1.1.0
    date: 2026-08-27
    summary: Add server-side pagination to Contacts list (REQ-CON-06)
  - version: 1.0.0
    date: 2026-08-21
    summary: Initial specification for Contacts management
---

# Feature Specification: Contacts Management

## 1. Overview

Provide capability to manage individual client contacts within the internal application.

## 2. Data Model (`Contact`)

- `id`: string (UUID, Primary Key)
- `clientId`: string (Unique, auto-generated, random 4-digit number, e.g. `4821`)
- `name`: string (Required, non-empty)
- `email`: string (Required, valid format, Unique)
- `branch`: string (Required, non-empty)
- `createdAt`: string (ISO Timestamp)
- `updatedAt`: string (ISO Timestamp)

## 3. Functional Requirements

### REQ-CON-01: Create Contact

- Must validate `name`, `email`, and `branch`.
- Email address must be unique across all contacts.
- System automatically generates a unique `clientId` as a random 4-digit number (e.g. `4821`).
- Returns the created `Contact` object.

### REQ-CON-02: View & List Contacts

- Displays contacts in tabular format with Client ID, Name, Email, Branch, Group, Date Added.
- Results are paginated per REQ-CON-06; the table displays only the current page of contacts.

### REQ-CON-03: Search Contacts

- Supports case-insensitive searching by `name`, `email`, or `branch`.
- Search updates results dynamically without requiring page navigation.
- Changing the search term resets pagination to page `1`.
- Pagination metadata (`total`, `totalPages`) reflects the filtered result set, not the full contact set.

### REQ-CON-04: Edit Contact:

- Allows updating existing contact details (`name`, `email`, `branch`).
- Enforces email uniqueness validation on update.

### REQ-CON-05: Delete Contact

- Permanently removes contact from the database upon user confirmation.
- Deleting a contact does NOT alter historical sent campaigns.

### REQ-CON-06: Pagination

- The List Contacts endpoint returns results in fixed-size pages rather than the full contact set.
- Accepts `page` (1-indexed, default `1`) and `pageSize` (default `10`, max `100`) query parameters.
- Response is a paginated envelope containing the current page of `Contact` records plus metadata: `total` (count of matching contacts), `page`, `pageSize`, and `totalPages`.
- Pagination is applied after search filtering (REQ-CON-03).
- Requesting a `page` beyond `totalPages` returns an empty `data` array — not an error.
- The UI displays previous/next navigation and the current page indicator (e.g. "Page 2 of 5") below the contacts table.
- Pagination controls are hidden when `totalPages <= 1`.

## 4. Validation Rules

- Required fields: Name, Email, Branch.
- Email must be a valid email format (`user@domain.com`).
- Duplicate emails are rejected with conflict error.
- `page` must be a positive integer; non-positive or non-integer values are rejected with a validation error.
- `pageSize` must be an integer between `1` and `100` inclusive; out-of-range values are rejected with a validation error.

## 5. API / Interface Specification

- `createContact(data: { name: string; email: string; branch: string }): Promise<Contact>`
- `getContacts(query?: { search?: string; page?: number; pageSize?: number }): Promise<PaginatedContacts>`
- `updateContact(id: string, data: Partial<CreateContactInput>): Promise<Contact>`
- `deleteContact(id: string): Promise<void>`

### `PaginatedContacts`

- `data`: `Contact[]` — the current page of contacts.
- `page`: number — current page number.
- `pageSize`: number — page size used.
- `total`: number — total matching contacts across all pages.
- `totalPages`: number — total number of pages (`Math.ceil(total / pageSize)`).

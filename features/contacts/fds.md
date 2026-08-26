---
id: contacts
title: Contacts Management
status: active
version: 1.0.0
owner: contacts-team
last_updated: 2026-08-14
coverage_target: 80
compliance_relevant: false
dependencies: []
changelog:
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

- Displays all contacts in tabular format with Client ID, Name, Email, Branch, Group, Date Added.
- The Group column shows the name of the group the contact belongs to, or `—` if the contact is not a member of any group.

### REQ-CON-03: Search Contacts

- Supports case-insensitive searching by `name`, `email`, or `branch`.
- Search updates results dynamically without requiring page navigation.

### REQ-CON-04: Edit Contact

- Allows updating existing contact details (`name`, `email`, `branch`).
- Enforces email uniqueness validation on update.

### REQ-CON-05: Delete Contact

- Permanently removes contact from the database upon user confirmation.
- Deleting a contact does NOT alter historical sent campaigns.

## 4. Validation Rules

- Required fields: Name, Email, Branch.
- Email must be a valid email format (`user@domain.com`).
- Duplicate emails are rejected with conflict error.

## 5. API / Interface Specification

- `createContact(data: { name: string; email: string; branch: string }): Promise<Contact>`
- `getContacts(query?: { search?: string }): Promise<Contact[]>`
- `updateContact(id: string, data: Partial<CreateContactInput>): Promise<Contact>`
- `deleteContact(id: string): Promise<void>`

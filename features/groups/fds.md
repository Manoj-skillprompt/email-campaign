---
id: groups
title: Contact Groups Management
status: draft
version: 1.0.0
owner: contacts-team
last_updated: 2026-08-25
coverage_target: 80
compliance_relevant: false
dependencies:
  - feature: contacts
    minVersion: 1.0.0
changelog:
  - version: 1.0.0
    date: 2026-08-25
    summary: Initial specification for Contact Groups management
---

# Feature Specification: Contact Groups Management

## 1. Overview

Provide capability to organize existing contacts into named groups within the internal application.

A group is a named collection of contacts. A contact may belong to at most one group at a time. Group membership is owned by this feature and references `Contact.id` from the `contacts` feature; it does not modify the `Contact` data model.

## 2. Data Model (`Group`)

- `id`: string (UUID, Primary Key)
- `name`: string (Required, non-empty, Unique)
- `contactIds`: string[] (IDs of contacts currently assigned to this group)
- `createdAt`: string (ISO Timestamp)
- `updatedAt`: string (ISO Timestamp)

## 3. Functional Requirements

### REQ-GRP-01: Create Group

- Must validate `name`.
- Group name must be unique across all groups.
- Returns the created `Group` object with an empty `contactIds` list.

### REQ-GRP-02: View & List Groups

- Displays all groups in tabular format with Name and Contact Count.

### REQ-GRP-03: Search Groups

- Supports case-insensitive searching by `name`.
- Search updates results dynamically without requiring page navigation.

### REQ-GRP-04: Edit Group

- Allows updating the group `name`.
- Enforces name uniqueness validation on update.

### REQ-GRP-05: Delete Group

- Permanently removes the group from the database upon user confirmation.
- Deleting a group unassigns its member contacts (they revert to no group); it does NOT delete the contacts themselves.

### REQ-GRP-06: Assign Contact to Group

- Allows assigning a contact to exactly one group, or unassigning it (no group).
- Assigning a contact already in another group moves it — it is removed from the previous group's `contactIds` and added to the new group's `contactIds`.

## 4. Validation Rules

- Required fields: Name.
- Duplicate group names are rejected with a conflict error.
- A contact ID referenced in an assignment must correspond to an existing contact.

## 5. API / Interface Specification

- `createGroup(data: { name: string }): Promise<Group>`
- `getGroups(query?: { search?: string }): Promise<Group[]>`
- `updateGroup(id: string, data: { name: string }): Promise<Group>`
- `deleteGroup(id: string): Promise<void>`
- `assignContactToGroup(groupId: string, contactId: string): Promise<Group>`
- `unassignContactFromGroup(groupId: string, contactId: string): Promise<Group>`

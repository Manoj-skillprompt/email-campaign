---
id: groups
title: Groups Management
status: active
version: 1.0.0
owner: groups-team
last_updated: 2026-08-17
coverage_target: 80
compliance_relevant: false
dependencies:
  - contacts
changelog:
  - version: 1.0.0
    date: 2026-08-17
    pr: "#002"
    summary: Initial specification for Groups management
---

# Feature Specification: Groups Management

## 1. Overview

Provide capability to organize contacts into distinct groups within the internal application.

## 2. Visual & UI Specification

- Authoritative Figma Frames: [`features/groups/visuals/figma.md`](features/groups/visuals/figma.md)

## 3. Dependencies

- `contacts` (Minimum version: 1.0.0)

## 4. Data Model (`Group`)

- `id`: string (UUID, Primary Key)
- `name`: string (Required, Unique, non-empty)
- `contactCount`: number (Non-negative integer)
- `createdAt`: string (ISO Timestamp)
- `updatedAt`: string (ISO Timestamp)

## 5. Functional Requirements

### REQ-GRP-01: Create Group

- Must validate Group `name`. Group name must be unique.
- User can optionally select zero or more contacts to add during creation.
- Prevents duplicate contacts within a group.

### REQ-GRP-02: View & List Groups

- Displays all groups in a card grid showing Group Name and Contact Count.
- Supports filtering groups by Group Name.

### REQ-GRP-03: Edit Group

- Allows renaming the group (enforcing name uniqueness).
- Allows adding contacts to or removing contacts from the group.

### REQ-GRP-04: Delete Group

- Deletes the group record upon confirmation.
- Deleting a group NEVER deletes member contacts.

## 6. Validation Rules

- Required fields: Name.
- Duplicate group names are rejected with conflict error.

## 7. API Specification

- `createGroup(data: { name: string; contactIds?: string[] }): Promise<Group>`
- `getGroups(query?: { search?: string }): Promise<Group[]>`
- `updateGroup(id: string, data: { name?: string; addContactIds?: string[]; removeContactIds?: string[] }): Promise<Group>`
- `deleteGroup(id: string): Promise<void>`

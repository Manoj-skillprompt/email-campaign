# Behavior Specification: Campaigns Management

## View Campaigns

- Opening Campaigns displays all campaigns.
- Search filters by Campaign Name.
- Status tabs filter by status (`All`, `Drafts`, `Scheduled`, `Sent`).

## Create Campaign & Save Draft

- Selecting New Campaign opens campaign editor with pre-filled default body (`Hi {{name}}, ...`).
- Selecting Save Draft validates required fields, saves campaign as Draft, and displays success feedback.
- Draft campaigns remain editable.

## Schedule Campaign

- Selecting Schedule validates required fields and opens date/time picker modal.
- Saving changes status to Scheduled and stores scheduled time.

## Send Now

- Selecting Send Now opens confirmation dialog displaying Campaign Name and resolved recipient count.
- Confirming transitions status to Sending and starts campaign processing.

## Campaign Processing & Recipient Resolution

- Recipient resolution occurs immediately before processing begins using live group membership.
- Recipients appearing in multiple groups receive only one email.
- `{{name}}` placeholder is replaced with contact name; unknown placeholders remain unchanged.
- Emails are dispatched to AWS SES.
- Successful completion transitions status to Sent with timestamp. Failures transition status to Failed.

## View Campaign Details

- Sent campaigns are immutable and display read-only campaign metadata, status, target groups, body preview, and execution timestamps.

## Duplicate Campaign

- Selecting Duplicate creates a new Draft copying Subject, Body, and Target Groups, with zero send history.

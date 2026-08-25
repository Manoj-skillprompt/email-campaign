# Behavior Specification: Campaigns Management

## View Campaigns

- Opening the Campaigns page displays campaigns in a table under the **All** tab by default.
- Switching tabs (**All**, **Drafts**, **Scheduled**, **Sent**) filters the table by status without a page reload.
- Supports case-insensitive searching by campaign name, updating the table dynamically.
- When no campaigns match the current tab/search, an empty state is displayed with a primary action to create a campaign.

## Create Campaign

- Selecting **+ New Campaign** opens the campaign composer modal.
- User fills in Name, Subject, Sender, and selects one or more Groups as the audience.
- User composes the email body using the rich text editor; the Preview pane updates live with Subject and body content.
- User may:
  - **Save draft** — saves the campaign as a draft with minimal validation (name required), closes or keeps the composer, refreshes the list, and shows a success notification.
  - **Schedule for later** — prompts for a date/time; on confirmation with full validation passed, sets the campaign to Scheduled, closes the composer, refreshes the list, and shows a success notification.
  - **Send now** — on confirmation with full validation passed, sends the campaign immediately, closes the composer, refreshes the list, and shows a success notification.
  - **Trash** — deletes the in-progress/existing campaign after a confirmation dialog.
- Validation errors block Schedule/Send while preserving entered form values; Save draft is not blocked by incomplete Groups/Subject.
- Closing the modal (X or Cancel-equivalent) without saving discards unsaved changes.

## Edit Campaign

- Selecting a Draft or Scheduled campaign from the table reopens the composer populated with existing values, following the same Save draft / Schedule / Send now / Trash behaviors as Create.
- Sent campaigns are read-only in the composer (no Schedule/Send/edit actions), but remain viewable for their metrics.

## Delete Campaign

- Selecting **Trash** opens a confirmation dialog warning of permanent removal.
- Confirmation permanently removes the campaign and displays a success notification.
- Cancelling performs no action.

 
# Behavior Specification: Contact Groups Management

## View Groups

- Opening the Groups page displays all groups as cards, each showing the group name, contact count ("N contacts matched"), and a preview of member avatars.
- Supports case-insensitive searching by group Name.
- When no groups match the search, an empty state is displayed with a primary action to create a group.

## Create Group

- Selecting **Create Group** opens the group form modal.
- User may Save or Cancel.
- Saving a valid, unique name creates the group, closes the form, refreshes the grid, and displays a success notification.
- Cancelling closes the form without saving.
- A duplicate name blocks submission with a conflict error while preserving the entered value.

## Edit Group

- Selecting **Edit** from a group card's overflow menu opens the group form populated with the current name.
- Saving updates the group, closes the form, refreshes the grid, and displays a success notification.
- Cancelling discards changes.
- A duplicate name blocks submission with a conflict error while preserving the entered value.

## Manage Group Membership

- Selecting **Manage Group** on a card opens the group's contact assignment view.
- Assigning a contact to the group adds it to the group's membership; if the contact already belongs to a different group, it is moved out of that group first.
- Unassigning a contact removes it from the group without deleting the contact.
- The group card's contact count and avatar preview update immediately to reflect membership changes.

## Delete Group

- Selecting **Delete** from a group card's overflow menu opens a confirmation dialog warning of permanent removal.
- Confirming permanently deletes the group, unassigns its member contacts (contacts are not deleted), and displays a success notification.
- Cancelling performs no action.

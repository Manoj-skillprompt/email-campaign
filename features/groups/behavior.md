# Behavior Specification: Groups Management

## View Groups

- Opening the Groups page displays all groups.
- Each group displays Name and Contact Count.
- Search filters groups by name.
- When no groups exist, an empty state is displayed with primary action to create a group.

## Create Group

- Selecting Create Group opens the group form modal.
- Users may enter group name, add contacts, or remove contacts.
- Saving creates the group, refreshes list, and displays success feedback.
- Cancelling closes the form.

## Edit Group

- Selecting Manage Group opens the group editor.
- Users may rename group, add contacts, or remove contacts.
- Saving refreshes displayed information.
- Cancelling discards changes.

## Delete Group

- Deleting a group requires confirmation.
- Confirmation removes only the group record. Member contacts remain completely unchanged.

# Behavior Specification: Contacts Management

## View Contacts

- Opening the Contacts page displays all contacts.
- Supports case-insensitive searching by Name, Email, or Branch.
- When no contacts match the search, an empty state is displayed with primary action to add a contact.

## Create Contact

- Selecting **Add Contact** opens the contact form modal.
- User may Save or Cancel.
- Saving a valid contact creates the contact, closes the form, refreshes the list, and displays a success notification.
- Cancelling closes the form without saving.
- Validation errors prevent submission while preserving entered form values.

## Edit Contact

- Selecting Edit opens the contact form populated with existing values.
- Saving updates the contact, closes the form, refreshes the list, and displays a success notification.
- Cancelling discards changes.

## Delete Contact

- Selecting Delete opens a confirmation dialog warning of permanent removal.
- Confirmation permanently removes contact, removes contact from all groups, and displays a success notification.
- Cancelling performs no action.

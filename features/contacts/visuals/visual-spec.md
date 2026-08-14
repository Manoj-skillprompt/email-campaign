# Visual Specification: Contacts UI Redesign (v1.1)

Reference Screenshot: [`features/contacts/visuals/contacts-design.png`](file:///home/sujal/programming/work/email-campaign/features/contacts/visuals/contacts-design.png)

## Visual Layout & Design Changes

1. **Header Layout**:
   - Title: `Contacts` (h1, bold font).
   - Subtitle: `${totalCount} total contacts found` under the header.
   - Top-right action: Blue primary button `+ Add Contact`.

2. **Search & Filter Controls Bar**:
   - Left side: Full search input with search icon placeholder `"Search contacts..."`.
   - Right side: Dropdown filter button `"All Groups"` with filter icon and trailing chevron.
   - Info icon tooltip button adjacent to the filter.

3. **Contacts Data Table**:
   - Columns:
     - Checkbox (Row selection)
     - `CLIENT ID`: Displayed in blue text with `#` prefix (e.g. `# LOCAL-1`, `# TCG-2798`).
     - `NAME`: Colored initial avatar badge + bold contact name.
     - `EMAIL`: Mail icon + contact email string.
     - `BRANCH`: Map pin icon + branch location.
     - `GROUP`: Pill badge displaying assigned group name or `-` if none.
     - `DATE ADDED`: Date string (e.g. `7/20/2026`).
     - Actions: Edit icon (pencil) and Delete icon (trash can).

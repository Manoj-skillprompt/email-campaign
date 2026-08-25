import { expect, test, type Page } from "@playwright/test";

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function uniqueEmail(prefix: string): string {
  return `${unique(prefix)}@example.com`;
}

function groupCard(page: Page, name: string) {
  return page
    .getByRole("button", { name: `More actions for ${name}` })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-lg')][1]");
}

function availableContactRow(page: Page, contactName: string) {
  return page.getByText(contactName, { exact: true }).locator("xpath=ancestor::div[contains(@class, 'rounded-lg')][1]");
}

async function addContact(page: Page, name: string, email: string, branch: string) {
  await page.goto("/contacts");
  await page.getByRole("button", { name: "Add Contact" }).first().click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Branch").fill(branch);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Contact created successfully.").last()).toBeVisible();
  await page.goto("/groups");
}

async function createGroup(page: Page, name: string) {
  await page.getByRole("button", { name: "+ Create Group" }).first().click();
  await page.getByRole("textbox", { name: "Group Name" }).fill(name);
  await page.getByRole("button", { name: "Configure Group →" }).click();
  await expect(page.getByText("Step 2 of 2: Manual Selection")).toBeVisible();
  await page.getByRole("button", { name: "Save Group" }).click();
  await expect(page.getByText("Group created successfully.").last()).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/groups");
});

test("Create Group: Save Group on step 2 creates the group and refreshes the grid", async ({ page }) => {
  const name = unique("VIP Customers");

  await createGroup(page, name);

  await expect(page.getByText(name, { exact: true })).toBeVisible();
  await expect(groupCard(page, name).getByText("0 contacts matched")).toBeVisible();
});

test("Create Group: Configure Group alone does not create anything until Save Group is clicked", async ({ page }) => {
  const name = unique("Not Yet Created");

  await page.getByRole("button", { name: "+ Create Group" }).first().click();
  await page.getByRole("textbox", { name: "Group Name" }).fill(name);
  await page.getByRole("button", { name: "Configure Group →" }).click();
  await expect(page.getByText("Step 2 of 2: Manual Selection")).toBeVisible();
  await expect(page.getByText(name, { exact: true })).not.toBeVisible();

  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByText(name, { exact: true })).not.toBeVisible();
});

test("Edit Group: saving a populated form refreshes the grid and shows a success notification", async ({ page }) => {
  const name = unique("Newsletter Subscribers");
  const newName = unique("Renamed Group");
  await createGroup(page, name);

  await groupCard(page, name)
    .getByRole("button", { name: `More actions for ${name}` })
    .click();
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByRole("textbox", { name: "Group Name" })).toHaveValue(name);
  await page.getByRole("textbox", { name: "Group Name" }).fill(newName);
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("Group updated successfully.")).toBeVisible();
  await expect(page.getByText(newName, { exact: true })).toBeVisible();
});

test("Delete Group: cancel keeps the group, confirm permanently removes it and unassigns members without deleting contacts", async ({
  page,
}) => {
  const groupName = unique("Removable Group");
  const contactName = unique("Member Contact");
  const contactEmail = uniqueEmail("delete-group");
  await addContact(page, contactName, contactEmail, "Nowhere");
  await createGroup(page, groupName);

  await groupCard(page, groupName).getByRole("button", { name: "Manage Group" }).click();
  await availableContactRow(page, contactName).getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Group Assigned Contacts (1)")).toBeVisible();
  await page.keyboard.press("Escape");

  await groupCard(page, groupName)
    .getByRole("button", { name: `More actions for ${groupName}` })
    .click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Delete Group")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText(groupName, { exact: true })).toBeVisible();

  await groupCard(page, groupName)
    .getByRole("button", { name: `More actions for ${groupName}` })
    .click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).last().click();

  await expect(page.getByText("Group deleted successfully.")).toBeVisible();
  await expect(page.getByText(groupName, { exact: true })).not.toBeVisible();

  await page.goto("/contacts");
  await expect(page.getByText(contactName, { exact: true })).toBeVisible();
});

test("Manage Group Membership: assigning a contact already in another group moves it; unassign removes membership without deleting the contact", async ({
  page,
}) => {
  const groupAName = unique("Group A");
  const groupBName = unique("Group B");
  const contactName = unique("Shared Contact");
  const contactEmail = uniqueEmail("membership");
  await addContact(page, contactName, contactEmail, "Somewhere");
  await createGroup(page, groupAName);
  await createGroup(page, groupBName);

  // Assign the contact to Group A.
  await groupCard(page, groupAName).getByRole("button", { name: "Manage Group" }).click();
  await availableContactRow(page, contactName).getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Group Assigned Contacts (1)")).toBeVisible();
  await expect(page.getByText(contactName, { exact: true }).last()).toBeVisible();
  await page.keyboard.press("Escape");

  // Assigning the same contact to Group B should move it out of Group A.
  await groupCard(page, groupBName).getByRole("button", { name: "Manage Group" }).click();
  await availableContactRow(page, contactName).getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Group Assigned Contacts (1)")).toBeVisible();
  await page.keyboard.press("Escape");

  await groupCard(page, groupAName).getByRole("button", { name: "Manage Group" }).click();
  await expect(page.getByText("Group Assigned Contacts (0)")).toBeVisible();
  await page.keyboard.press("Escape");

  // Unassigning from Group B removes membership without deleting the contact.
  await groupCard(page, groupBName).getByRole("button", { name: "Manage Group" }).click();
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Group Assigned Contacts (0)")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/contacts");
  await expect(page.getByText(contactName, { exact: true })).toBeVisible();
});

test("Search: filters dynamically and the empty-state action opens the Create Group wizard", async ({ page }) => {
  const name = unique("Findable Group");
  await createGroup(page, name);

  await page.getByPlaceholder("Search groups...").fill(name);
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  await page.getByPlaceholder("Search groups...").fill("no-such-group-xyz");
  await expect(page.getByText("No groups found")).toBeVisible();

  await page.getByRole("button", { name: "+ Create Group" }).last().click();
  await expect(page.getByText("Step 1 of 2: Basics")).toBeVisible();
});

test("Duplicate name: create and edit both surface a conflict error without corrupting form state", async ({
  page,
}) => {
  const takenName = unique("Duplicate Blocked");
  await createGroup(page, takenName);

  // Duplicate on create — surfaces back on step 1 since the group is only created on Save Group.
  await page.getByRole("button", { name: "+ Create Group" }).first().click();
  await page.getByRole("textbox", { name: "Group Name" }).fill(takenName);
  await page.getByRole("button", { name: "Configure Group →" }).click();
  await page.getByRole("button", { name: "Save Group" }).click();

  await expect(page.getByText(`A group with name "${takenName}" already exists.`)).toBeVisible();
  await expect(page.getByText("Step 1 of 2: Basics")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Group Name" })).toHaveValue(takenName);
  await page.getByRole("button", { name: "Close" }).click();

  // Duplicate on edit
  const secondName = unique("Second Group");
  await createGroup(page, secondName);

  await groupCard(page, secondName)
    .getByRole("button", { name: `More actions for ${secondName}` })
    .click();
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("textbox", { name: "Group Name" }).fill(takenName);
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText(`A group with name "${takenName}" already exists.`)).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Group Name" })).toHaveValue(takenName);
});

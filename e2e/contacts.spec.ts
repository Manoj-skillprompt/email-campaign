import { expect, test } from "@playwright/test";

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function uniqueEmail(prefix: string): string {
  return `${unique(prefix)}@example.com`;
}

async function addContact(page: import("@playwright/test").Page, name: string, email: string, branch: string) {
  await page.getByRole("button", { name: "Add Contact" }).first().click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Branch").fill(branch);
  await page.getByRole("button", { name: "Save" }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/contacts");
});

test("Create Contact: valid submission refreshes the list and shows a success notification", async ({ page }) => {
  const name = unique("Grace Hopper");
  const email = uniqueEmail("create");

  await addContact(page, name, email, "Arlington");

  await expect(page.getByText("Contact created successfully.").last()).toBeVisible();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  await expect(page.getByText(email, { exact: true })).toBeVisible();
});

test("Edit Contact: saving populated form refreshes the list and shows a success notification", async ({ page }) => {
  const name = unique("Alan Turing");
  const email = uniqueEmail("edit");
  await addContact(page, name, email, "London");
  await expect(page.getByText("Contact created successfully.").last()).toBeVisible();

  await page.getByRole("button", { name: `Edit ${name}`, exact: true }).click();
  await expect(page.getByLabel("Name")).toHaveValue(name);
  await page.getByLabel("Branch").fill("Manchester");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("Contact updated successfully.")).toBeVisible();
  const row = page.getByRole("row", { name: new RegExp(name) });
  await expect(row.getByText("Manchester", { exact: true })).toBeVisible();
});

test("Delete Contact: cancel keeps the contact, confirm permanently removes it", async ({ page }) => {
  const name = unique("Delete Candidate");
  const email = uniqueEmail("delete");
  await addContact(page, name, email, "Nowhere");
  await expect(page.getByText("Contact created successfully.").last()).toBeVisible();

  await page.getByRole("button", { name: `Delete ${name}`, exact: true }).click();
  await expect(page.getByText("Delete Contact")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: `Delete ${name}`, exact: true }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).last().click();

  await expect(page.getByText("Contact deleted successfully.")).toBeVisible();
  await expect(page.getByText(email, { exact: true })).not.toBeVisible();
});

test("Search: filters dynamically and the empty state opens the Add Contact form", async ({ page }) => {
  const name = unique("Findable Person");
  const uniqueBranch = unique("Branch");
  const email = uniqueEmail("search");
  await addContact(page, name, email, uniqueBranch);
  await expect(page.getByText("Contact created successfully.").last()).toBeVisible();

  await page.getByPlaceholder("Search contacts...").fill(uniqueBranch.toLowerCase());
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  await page.getByPlaceholder("Search contacts...").fill("no-such-contact-xyz");
  await expect(page.getByText("No contacts found")).toBeVisible();

  await page.getByRole("button", { name: "Add Contact" }).last().click();
  await expect(page.getByRole("heading", { name: "Add Contact", exact: true })).toBeVisible();
  await expect(page.getByLabel("Name")).toBeVisible();
});

test("Duplicate email: create and edit both surface a conflict error without losing entered values", async ({
  page,
}) => {
  const takenEmail = uniqueEmail("taken");
  await addContact(page, unique("Original Owner"), takenEmail, "Original Branch");
  await expect(page.getByText("Contact created successfully.").last()).toBeVisible();

  // Duplicate on create
  await page.getByRole("button", { name: "Add Contact" }).click();
  await page.getByLabel("Name").fill("Impostor");
  await page.getByLabel("Email").fill(takenEmail);
  await page.getByLabel("Branch").fill("Impostor Branch");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText(`A contact with email "${takenEmail}" already exists.`)).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveValue("Impostor");
  await page.getByRole("button", { name: "Cancel" }).click();

  // Duplicate on edit
  const secondName = unique("Second Contact");
  const secondEmail = uniqueEmail("second");
  await addContact(page, secondName, secondEmail, "Second Branch");
  await expect(page.getByText("Contact created successfully.").last()).toBeVisible();

  await page.getByRole("button", { name: `Edit ${secondName}`, exact: true }).click();
  await page.getByLabel("Email").fill(takenEmail);
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText(`A contact with email "${takenEmail}" already exists.`)).toBeVisible();
  await expect(page.getByLabel("Branch")).toHaveValue("Second Branch");
});

test("Pagination: navigates between pages and hides controls when everything fits on one page, scoped by search", async ({
  page,
}) => {
  const branch = unique("PagBranch");
  for (let i = 0; i < 11; i += 1) {
    await addContact(page, unique(`Page Contact ${i}`), uniqueEmail(`page${i}`), branch);
    await expect(page.getByText("Contact created successfully.").last()).toBeVisible();
  }

  await page.getByPlaceholder("Search contacts...").fill(branch);
  await expect(page.getByText("Page 1 of 2")).toBeVisible();
  await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();

  await page.getByRole("button", { name: "Previous" }).click();
  await expect(page.getByText("Page 1 of 2")).toBeVisible();

  await page.getByPlaceholder("Search contacts...").fill("no-such-branch-for-this-run");
  await expect(page.getByText("No contacts found")).toBeVisible();
});

test("Search resets pagination back to page 1", async ({ page }) => {
  const branch = unique("ResetBranch");
  for (let i = 0; i < 11; i += 1) {
    await addContact(page, unique(`Reset Contact ${i}`), uniqueEmail(`reset${i}`), branch);
    await expect(page.getByText("Contact created successfully.").last()).toBeVisible();
  }

  await page.getByPlaceholder("Search contacts...").fill(branch);
  await expect(page.getByText("Page 1 of 2")).toBeVisible();

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();

  await page.getByPlaceholder("Search contacts...").fill(branch.slice(0, -1));
  await expect(page.getByText("Page 1 of 2")).toBeVisible();
});

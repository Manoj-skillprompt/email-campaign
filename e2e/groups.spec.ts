import { expect, test } from "@playwright/test";

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createContact(page: import("@playwright/test").Page, name: string, email: string, branch: string) {
  await page.getByRole("button", { name: "Add Contact" }).click();
  await page.fill("#contact-name", name);
  await page.fill("#contact-email", email);
  await page.fill("#contact-branch", branch);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Contact created successfully.").last()).toBeVisible();
}

test.describe("Groups full lifecycle (T21)", () => {
  test("create a group with contacts, search finds it, edit updates members, delete removes it", async ({ page }) => {
    const suffix = uniqueSuffix();
    const contactAName = `Group E2E Contact A ${suffix}`;
    const contactBName = `Group E2E Contact B ${suffix}`;
    const emailA = `group-e2e-a-${suffix}@example.com`;
    const emailB = `group-e2e-b-${suffix}@example.com`;
    const groupName = `Group E2E ${suffix}`;
    const renamedGroupName = `Group E2E Renamed ${suffix}`;

    // Seed two contacts to add to the group.
    await page.goto("/contacts");
    await createContact(page, contactAName, emailA, "Kathmandu");
    await createContact(page, contactBName, emailB, "Pokhara");

    // Create a group with contact A.
    await page.goto("/groups");
    await page.getByRole("button", { name: "+ Create Group" }).click();
    await page.fill("#group-name", groupName);
    await page.getByLabel("Search contacts to add").fill(contactAName);
    await page.getByText(contactAName).click();
    await page.getByRole("button", { name: "Save Group" }).click();
    await expect(page.getByText("Group created successfully.")).toBeVisible();
    await expect(page.getByText(groupName)).toBeVisible();

    // Search finds it.
    await page.getByLabel("Search groups").fill(groupName);
    await expect(page.getByText(groupName)).toBeVisible();
    await page.getByLabel("Search groups").fill("");

    // Edit: rename, add contact B, remove contact A.
    await page.getByRole("button", { name: `Manage ${groupName}` }).click();
    await page.fill("#group-name", renamedGroupName);
    await page.getByLabel("Search contacts to add").fill(contactBName);
    await page.getByText(contactBName).click();
    await page.getByLabel("Search contacts to add").fill(contactAName);
    await page.getByText(contactAName).click();
    await page.getByRole("button", { name: "Save Group" }).click();
    await expect(page.getByText("Group updated successfully.")).toBeVisible();

    await page.getByLabel("Search groups").fill(renamedGroupName);
    await expect(page.getByText(renamedGroupName)).toBeVisible();
    await expect(page.getByText("1 contacts matched")).toBeVisible();
    await page.getByLabel("Search groups").fill("");

    // Delete removes the group; member contacts remain untouched.
    await page.getByRole("button", { name: `More options for ${renamedGroupName}` }).click();
    await page.getByRole("button", { name: "Delete Group" }).click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Group deleted successfully.")).toBeVisible();
    await page.getByLabel("Search groups").fill(renamedGroupName);
    await expect(page.getByText("No groups found")).toBeVisible();

    await page.goto("/contacts");
    await page.getByLabel("Search contacts").fill(emailA);
    await expect(page.getByText(contactAName)).toBeVisible();
    await page.getByLabel("Search contacts").fill(emailB);
    await expect(page.getByText(contactBName)).toBeVisible();
  });
});

test.describe("Duplicate group name rejection (T22)", () => {
  test("creating a group with a duplicate name shows a visible error", async ({ page }) => {
    const suffix = uniqueSuffix();
    const groupName = `Dup Group ${suffix}`;

    await page.goto("/groups");

    await page.getByRole("button", { name: "+ Create Group" }).click();
    await page.fill("#group-name", groupName);
    await page.getByRole("button", { name: "Save Group" }).click();
    await expect(page.getByText("Group created successfully.")).toBeVisible();

    await page.getByRole("button", { name: "+ Create Group" }).click();
    await page.fill("#group-name", groupName);
    await page.getByRole("button", { name: "Save Group" }).click();

    await expect(page.getByText("A group with this name already exists")).toBeVisible();
    await expect(page.locator("#group-name")).toHaveValue(groupName);
  });

  test("renaming a group to a duplicate name is rejected", async ({ page }) => {
    const suffix = uniqueSuffix();
    const nameA = `Rename Dup A ${suffix}`;
    const nameB = `Rename Dup B ${suffix}`;

    await page.goto("/groups");

    await page.getByRole("button", { name: "+ Create Group" }).click();
    await page.fill("#group-name", nameA);
    await page.getByRole("button", { name: "Save Group" }).click();
    await expect(page.getByText("Group created successfully.").first()).toBeVisible();

    await page.getByRole("button", { name: "+ Create Group" }).click();
    await page.fill("#group-name", nameB);
    await page.getByRole("button", { name: "Save Group" }).click();
    await expect(page.getByText("Group created successfully.").last()).toBeVisible();

    await page.getByRole("button", { name: `Manage ${nameB}` }).click();
    await page.fill("#group-name", nameA);
    await page.getByRole("button", { name: "Save Group" }).click();

    await expect(page.getByText("A group with this name already exists")).toBeVisible();
  });
});

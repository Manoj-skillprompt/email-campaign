import { expect, test } from "@playwright/test";

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

test.describe("Contacts full lifecycle (T16)", () => {
  test("create, list, search, edit, and delete a contact", async ({ page }) => {
    const name = "Ada Lovelace";
    const email = uniqueEmail("ada");
    const branch = "London";

    await page.goto("/contacts");

    // Create
    await page.getByRole("button", { name: "Add Contact" }).click();
    await page.fill("#contact-name", name);
    await page.fill("#contact-email", email);
    await page.fill("#contact-branch", branch);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Contact created successfully.")).toBeVisible();
    await expect(page.getByText(name)).toBeVisible();

    // Search finds it
    await page.getByLabel("Search contacts").fill(email);
    await expect(page.getByText(name)).toBeVisible();
    const rowCountAfterSearch = await page.locator("tbody tr").count();
    expect(rowCountAfterSearch).toBe(1);
    await page.getByLabel("Search contacts").fill("");

    // Edit updates it
    await page.getByRole("button", { name: `Edit ${name}` }).click();
    await page.fill("#contact-branch", "Cambridge");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Contact updated successfully.")).toBeVisible();
    await page.getByLabel("Search contacts").fill(email);
    await expect(page.getByText("Cambridge")).toBeVisible();
    await page.getByLabel("Search contacts").fill("");

    // Delete removes it
    await page.getByRole("button", { name: `Delete ${name}` }).click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Contact deleted successfully.")).toBeVisible();
    await page.getByLabel("Search contacts").fill(email);
    await expect(page.getByText("No contacts found")).toBeVisible();
  });
});

test.describe("Duplicate email rejection (T17)", () => {
  test("creating a contact with a duplicate email shows a visible error", async ({ page }) => {
    const email = uniqueEmail("dup");

    await page.goto("/contacts");

    // Seed a contact with this email.
    await page.getByRole("button", { name: "Add Contact" }).click();
    await page.fill("#contact-name", "First Contact");
    await page.fill("#contact-email", email);
    await page.fill("#contact-branch", "Pokhara");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Contact created successfully.")).toBeVisible();

    // Attempt to create a second contact with the same email.
    await page.getByRole("button", { name: "Add Contact" }).click();
    await page.fill("#contact-name", "Second Contact");
    await page.fill("#contact-email", email);
    await page.fill("#contact-branch", "Kathmandu");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("A contact with this email already exists")).toBeVisible();
    // The modal must stay open with entered values preserved.
    await expect(page.locator("#contact-name")).toHaveValue("Second Contact");
    await expect(page.locator("#contact-branch")).toHaveValue("Kathmandu");
  });

  test("editing a contact to a duplicate email is rejected", async ({ page }) => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nameA = `Contact A ${suffix}`;
    const nameB = `Contact B ${suffix}`;
    const emailA = uniqueEmail("edit-a");
    const emailB = uniqueEmail("edit-b");

    await page.goto("/contacts");

    await page.getByRole("button", { name: "Add Contact" }).click();
    await page.fill("#contact-name", nameA);
    await page.fill("#contact-email", emailA);
    await page.fill("#contact-branch", "Butwal");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Contact created successfully.").first()).toBeVisible();

    await page.getByRole("button", { name: "Add Contact" }).click();
    await page.fill("#contact-name", nameB);
    await page.fill("#contact-email", emailB);
    await page.fill("#contact-branch", "Dharan");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Contact created successfully.").last()).toBeVisible();

    await page.getByRole("button", { name: `Edit ${nameB}` }).click();
    await page.fill("#contact-email", emailA);
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("A contact with this email already exists")).toBeVisible();
  });
});

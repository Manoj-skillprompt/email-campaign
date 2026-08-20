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

async function createGroup(page: import("@playwright/test").Page, groupName: string, contactNames: string[]) {
  await page.goto("/groups");
  await page.getByRole("button", { name: "+ Create Group" }).click();
  await page.fill("#group-name", groupName);
  for (const contactName of contactNames) {
    await page.getByLabel("Search contacts to add").fill(contactName);
    await page.getByText(contactName).click();
  }
  await page.getByRole("button", { name: "Save Group" }).click();
  await expect(page.getByText("Group created successfully.").last()).toBeVisible();
}

function nearFutureLocalDateTime(msFromNow: number): string {
  const date = new Date(Date.now() + msFromNow);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

test.describe("Campaign send lifecycle (T30)", () => {
  test("create a Draft campaign targeting two overlapping groups, send now shows deduplicated recipients, status becomes Sent", async ({
    page,
  }) => {
    const suffix = uniqueSuffix();
    const nameA = `Campaign E2E Contact A ${suffix}`;
    const nameB = `Campaign E2E Contact B ${suffix}`;
    const nameC = `Campaign E2E Contact C ${suffix}`;
    const groupAName = `Campaign E2E Group A ${suffix}`;
    const groupBName = `Campaign E2E Group B ${suffix}`;
    const campaignName = `Campaign E2E Send ${suffix}`;

    await page.goto("/contacts");
    await createContact(page, nameA, `campaign-e2e-a-${suffix}@example.com`, "Kathmandu");
    await createContact(page, nameB, `campaign-e2e-b-${suffix}@example.com`, "Pokhara");
    await createContact(page, nameC, `campaign-e2e-c-${suffix}@example.com`, "Biratnagar");

    // Group A and Group B overlap on contact B, so the deduplicated recipient count is 3 (A, B, C).
    await createGroup(page, groupAName, [nameA, nameB]);
    await createGroup(page, groupBName, [nameB, nameC]);

    await page.goto("/campaigns");
    await page.getByRole("button", { name: "+ New Campaign" }).click();
    await page.fill("#campaign-name", campaignName);
    await page.fill("#campaign-subject", "Welcome aboard");
    await page.getByText(groupAName).click();
    await page.getByText(groupBName).click();
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Campaign saved as draft.")).toBeVisible();

    await page.getByLabel("Search campaigns").fill(campaignName);
    await expect(page.getByText(campaignName)).toBeVisible();

    await page.getByText(campaignName).click();
    await page.getByRole("button", { name: "Send now" }).click();

    await expect(page.getByRole("dialog").getByText("Send Campaign Now")).toBeVisible();
    await expect(page.getByText("3 recipients")).toBeVisible();

    await page.getByRole("button", { name: "Send Now" }).click();
    await expect(page.getByText("Campaign sent successfully.")).toBeVisible();

    await page.getByLabel("Search campaigns").fill(campaignName);
    await expect(page.getByTestId("campaign-table").getByText("SENT")).toBeVisible();
  });
});

test.describe("Schedule then edit-blocked lifecycle (T31)", () => {
  test("scheduling a Draft campaign blocks further editing", async ({ page }) => {
    const suffix = uniqueSuffix();
    const contactName = `Campaign E2E Schedule Contact ${suffix}`;
    const groupName = `Campaign E2E Schedule Group ${suffix}`;
    const campaignName = `Campaign E2E Schedule ${suffix}`;

    await page.goto("/contacts");
    await createContact(page, contactName, `campaign-e2e-sched-${suffix}@example.com`, "Lalitpur");
    await createGroup(page, groupName, [contactName]);

    await page.goto("/campaigns");
    await page.getByRole("button", { name: "+ New Campaign" }).click();
    await page.fill("#campaign-name", campaignName);
    await page.fill("#campaign-subject", "Scheduled subject");
    await page.getByText(groupName).click();
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Campaign saved as draft.")).toBeVisible();

    await page.getByLabel("Search campaigns").fill(campaignName);
    await page.getByText(campaignName).click();
    await page.getByRole("button", { name: "Schedule for later" }).click();

    await expect(page.getByText("Schedule Campaign")).toBeVisible();
    await page.fill("#scheduled-at", nearFutureLocalDateTime(60 * 60 * 1000));
    await page.getByRole("button", { name: "Confirm Schedule" }).click();
    await expect(page.getByText("Campaign scheduled successfully.")).toBeVisible();

    await page.getByLabel("Search campaigns").fill(campaignName);
    await expect(page.getByTestId("campaign-table").getByText("SCHEDULED")).toBeVisible();

    // The now-Scheduled campaign opens a read-only detail view instead of the editable form.
    await page.getByText(campaignName).click();
    await expect(page.getByRole("dialog").getByText(campaignName)).toBeVisible();
    await expect(page.getByRole("button", { name: "Save draft" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
  });
});

test.describe("Duplicate lifecycle (T32)", () => {
  test("duplicating a campaign creates a new Draft with copied Subject/Body/Target Groups", async ({ page }) => {
    const suffix = uniqueSuffix();
    const contactName = `Campaign E2E Dup Contact ${suffix}`;
    const groupName = `Campaign E2E Dup Group ${suffix}`;
    const campaignName = `Campaign E2E Dup ${suffix}`;
    const subject = `Dup Subject ${suffix}`;
    const body = `Dup Body ${suffix}`;

    await page.goto("/contacts");
    await createContact(page, contactName, `campaign-e2e-dup-${suffix}@example.com`, "Bhaktapur");
    await createGroup(page, groupName, [contactName]);

    await page.goto("/campaigns");
    await page.getByRole("button", { name: "+ New Campaign" }).click();
    await page.fill("#campaign-name", campaignName);
    await page.fill("#campaign-subject", subject);
    await page.fill("#campaign-body", body);
    await page.getByText(groupName).click();
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Campaign saved as draft.")).toBeVisible();

    await page.getByLabel("Search campaigns").fill(campaignName);
    await page.getByRole("button", { name: `More options for ${campaignName}` }).click();
    await page.getByRole("button", { name: "Duplicate" }).click();
    await expect(page.getByText("Campaign duplicated successfully.")).toBeVisible();

    await page.getByLabel("Search campaigns").fill(campaignName);
    await expect(page.getByText(campaignName)).toHaveCount(2);

    // Rows are ordered newest first, so the duplicate is the first match.
    await page.getByText(campaignName).first().click();
    await expect(page.getByLabel("Subject")).toHaveValue(subject);
    await expect(page.getByLabel("Body")).toHaveValue(body);
    await expect(page.getByRole("dialog").getByText(groupName)).toBeVisible();
    // The duplicate is a fresh, editable Draft (no send history carried over).
    await expect(page.getByRole("button", { name: "Save draft" })).toBeVisible();
  });
});

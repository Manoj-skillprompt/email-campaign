import { expect, test, type Page } from "@playwright/test";

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

async function createGroup(page: Page, name: string) {
  await page.goto("/groups");
  await page.getByRole("button", { name: "+ Create Group" }).first().click();
  await page.getByRole("textbox", { name: "Group Name" }).fill(name);
  await page.getByRole("button", { name: "Configure Group →" }).click();
  await expect(page.getByText("Step 2 of 2: Manual Selection")).toBeVisible();
  await page.getByRole("button", { name: "Save Group" }).click();
  await expect(page.getByText("Group created successfully.").last()).toBeVisible();
  await page.goto("/campaign");
}

async function fillFullyValidCampaign(page: Page, name: string, groupName: string) {
  await page.getByRole("button", { name: "+ New Campaign" }).first().click();
  await page.getByLabel("Campaign name").fill(name);
  await page.getByLabel("Subject").fill("Hello there");
  await page.getByLabel("Sender").selectOption({ label: "Skillprompt <info@skillprompt.com>" });
  await page.getByLabel("Add group to audience").selectOption({ label: groupName });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/campaign");
});

test("Create Campaign: Save draft persists a DRAFT campaign and refreshes the list", async ({ page }) => {
  const name = unique("Draft Campaign");

  await page.getByRole("button", { name: "+ New Campaign" }).first().click();
  await page.getByLabel("Campaign name").fill(name);
  await page.getByRole("button", { name: "Save draft" }).click();

  await expect(page.getByText("Campaign saved as draft.")).toBeVisible();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Drafts/ }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
});

test("Create Campaign: composing without saving does not create anything", async ({ page }) => {
  const name = unique("Not Yet Created Campaign");

  await page.getByRole("button", { name: "+ New Campaign" }).first().click();
  await page.getByLabel("Campaign name").fill(name);
  await page.getByRole("button", { name: "Close" }).click();

  await expect(page.getByText(name, { exact: true })).not.toBeVisible();
});

test("Schedule Campaign: a fully valid campaign can be scheduled for later", async ({ page }) => {
  const groupName = unique("Schedule Audience");
  const campaignName = unique("Timed Send Campaign");
  await createGroup(page, groupName);

  await fillFullyValidCampaign(page, campaignName, groupName);
  await page.getByRole("button", { name: "Schedule for later" }).click();
  await page.getByLabel("Scheduled date and time").fill("2027-01-15T09:00");
  await page.getByRole("button", { name: "Confirm Schedule" }).click();

  await expect(page.getByText("Campaign scheduled successfully.")).toBeVisible();
  await page.getByRole("button", { name: "Scheduled", exact: true }).click();
  await expect(page.getByText(campaignName, { exact: true })).toBeVisible();
});

test("Validation: Schedule and Send are blocked on an incomplete campaign, but Save draft succeeds with only a name", async ({
  page,
}) => {
  const name = unique("Incomplete Campaign");

  await page.getByRole("button", { name: "+ New Campaign" }).first().click();
  await page.getByLabel("Campaign name").fill(name);

  await page.getByRole("button", { name: "Send now" }).click();
  await expect(
    page.getByText("Name, subject, sender, and at least one group are required to send a campaign.")
  ).toBeVisible();

  await page.getByRole("button", { name: "Schedule for later" }).click();
  await page.getByLabel("Scheduled date and time").fill("2027-01-15T09:00");
  await page.getByRole("button", { name: "Confirm Schedule" }).click();
  await expect(
    page.getByText("Name, subject, sender, and at least one group are required to schedule a campaign.")
  ).toBeVisible();

  // The inline date/time picker stays open until explicitly cancelled or confirmed.
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Campaign saved as draft.")).toBeVisible();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
});

test("Send Now: a fully valid campaign is sent and moves to the Sent tab with a matching recipient count", async ({
  page,
}) => {
  // The audience group here has no members, so this exercises the full round trip
  // (validation -> status transition -> recipient resolution -> sentCount) without
  // depending on whether real AWS SES credentials happen to be reachable in this
  // environment: zero recipients means the email-sending call is never attempted.
  // The actual send-to-real-recipients path is covered at the service/router level
  // with a fake/mocked EmailSender (campaign-service.test.ts, campaign-router.test.ts).
  const groupName = unique("Empty Send Audience");
  const campaignName = unique("Zero Recipient Campaign");
  await createGroup(page, groupName);

  await fillFullyValidCampaign(page, campaignName, groupName);
  await page.getByRole("button", { name: "Send now" }).click();

  await expect(page.getByText("Campaign sent successfully.")).toBeVisible();
  await page.getByRole("button", { name: "Sent", exact: true }).click();
  const row = page.getByRole("row", { name: new RegExp(campaignName) });
  await expect(row).toBeVisible();
  await expect(row.getByRole("cell", { name: "0", exact: true })).toBeVisible();
});

test("Delete Campaign: cancel keeps the campaign, confirm permanently removes it", async ({ page }) => {
  const name = unique("Removable Campaign");

  await page.getByRole("button", { name: "+ New Campaign" }).first().click();
  await page.getByLabel("Campaign name").fill(name);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Campaign saved as draft.")).toBeVisible();

  await page.getByRole("button", { name: `Delete ${name}` }).click();
  await expect(page.getByText("Delete Campaign")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: `Delete ${name}` }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).last().click();

  await expect(page.getByText("Campaign deleted successfully.")).toBeVisible();
  await expect(page.getByText(name, { exact: true })).not.toBeVisible();
});

test("Edit Campaign: reopening a draft populates the composer with existing values", async ({ page }) => {
  const name = unique("Editable Draft");
  const newName = unique("Renamed Draft");

  await page.getByRole("button", { name: "+ New Campaign" }).first().click();
  await page.getByLabel("Campaign name").fill(name);
  await page.getByLabel("Subject").fill("Original Subject");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Campaign saved as draft.").last()).toBeVisible();

  await page.getByText(name, { exact: true }).click();
  await expect(page.getByLabel("Campaign name")).toHaveValue(name);
  await expect(page.getByLabel("Subject")).toHaveValue("Original Subject");

  await page.getByLabel("Campaign name").fill(newName);
  await page.getByRole("button", { name: "Save draft" }).click();

  await expect(page.getByText("Campaign saved as draft.").last()).toBeVisible();
  await expect(page.getByText(newName, { exact: true })).toBeVisible();
});

test("Search: filters dynamically and the empty-state action opens the composer", async ({ page }) => {
  const name = unique("Findable Campaign");

  await page.getByRole("button", { name: "+ New Campaign" }).first().click();
  await page.getByLabel("Campaign name").fill(name);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Campaign saved as draft.")).toBeVisible();

  await page.getByPlaceholder("Search campaigns...").fill(name);
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  await page.getByPlaceholder("Search campaigns...").fill("no-such-campaign-xyz");
  await expect(page.getByText("No campaigns found")).toBeVisible();

  await page.getByRole("button", { name: "+ New Campaign" }).last().click();
  await expect(page.getByLabel("Campaign name")).toBeVisible();
});

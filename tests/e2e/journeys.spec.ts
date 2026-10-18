import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("guest image request → verified intake → real case event", async ({
  page,
}) => {
  await page.goto("/help");
  await page
    .getByLabel("What’s on your mind?")
    .fill("Synthetic test: I would like to explore housing support. नमस्ते ❤️");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Safe contact preference")).toHaveValue("none");
  await page.getByLabel("City or region (optional)").fill("Synthetic city");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const approved = "Approved synthetic test message. नमस्ते ❤️";
  await page.getByLabel("Approved message").fill(approved);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel("City or region (optional)")).toHaveValue(
    "Synthetic city",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Approved message")).toHaveValue(approved);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: /Prepare a discreet PNG/ }).check();
  await page
    .getByRole("button", { name: "Prepare request", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your request is saved." }),
  ).toBeVisible();
  await expect(page.getByText(approved, { exact: true })).toBeVisible();
  const cid = page.url().split("/").pop();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page
      .getByRole("button", { name: "Download verified PNG", exact: true })
      .click(),
  ]);
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Open demo workspace" }).click();
  await page.goto("/responder/intake");
  await page.getByLabel("Choose image (max 8 MB)").setInputFiles(path!);
  await page.getByRole("button", { name: "Verify & preview" }).click();
  await expect(page.getByText(approved, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Confirm intake" }).click();
  await expect(page).toHaveURL(new RegExp("/responder/cases/" + cid));
  await page
    .getByLabel("Private case note")
    .fill("Synthetic test note: review completed.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByText("Synthetic test note: review completed.", { exact: true }),
  ).toBeVisible();
});

test("public pages fit viewport and basic accessibility", async ({ page }) => {
  for (const route of [
    "/",
    "/help",
    "/support",
    "/rights",
    "/resources",
    "/privacy-safety",
    "/sign-in",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    const size = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: window.innerWidth,
    }));
    expect(size.scroll).toBeLessThanOrEqual(size.width + 1);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

      .analyze();
    expect(results.violations).toEqual([]);
  }
});

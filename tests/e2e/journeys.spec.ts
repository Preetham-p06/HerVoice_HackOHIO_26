import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function visit(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('html[data-app-ready="true"]')).toBeAttached();
}

test("guest image request → verified intake → real case event", async ({
  page,
}) => {
  await visit(page, "/help");
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
  await visit(page, "/sign-in");
  await page.getByRole("button", { name: "Open demo workspace" }).click();
  await expect(page).toHaveURL(/\/responder$/);
  await visit(page, "/responder/intake");
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
    await visit(page, route);
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

test("visible help panel is keyboard accessible and preserves a draft", async ({
  page,
}) => {
  await visit(page, "/help");
  const draft = "Synthetic test: please preserve these words.";
  await page.getByLabel("What’s on your mind?").fill(draft);
  await page
    .getByRole("button", {
      name: /Help optionsChoose your next step|Help options/,
    })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "What would help right now?",
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: /Call a real advocate/ }),
  ).toHaveAttribute("href", "tel:18007997233");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByLabel("What’s on your mind?")).toHaveValue(draft);
  await expect(
    page.getByRole("button", { name: /Help options/ }),
  ).toBeFocused();
});

test("U.S. resources and legal defaults", async ({ page }) => {
  await visit(page, "/rights");
  await expect(page.getByLabel("Jurisdiction", { exact: true })).toHaveValue(
    "United States",
  );
  await page.getByLabel("State or territory (optional)").selectOption("Ohio");
  await page
    .getByLabel("What would you like to understand?")
    .fill("protection order forms");
  await page.getByRole("button", { name: "Explore sources" }).click();
  await expect(
    page.getByText("Supreme Court of Ohio — Domestic Violence Program", {
      exact: true,
    }),
  ).toBeVisible();
  await visit(page, "/resources");
  await expect(page.getByLabel("Location", { exact: true })).toHaveValue(
    "United States",
  );
  await expect(page.getByText("India Code", { exact: true })).toHaveCount(0);
});

import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function visit(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('html[data-app-ready="true"]')).toBeAttached();
  await page
    .getByRole("button", { name: "Personal space", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Open support tools", exact: true })
    .click();
  await expect(page.locator(".private-shell")).toBeVisible();
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
  await expect(page).toHaveURL(/\/workspace$/);
  await visit(page, "/responder/intake");
  await page.getByLabel("Choose image (max 8 MB)").setInputFiles(path!);
  await page.getByRole("button", { name: "Verify & preview" }).click();
  await expect(page.getByText(approved, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Confirm intake" }).click();
  await expect(page).toHaveURL(new RegExp("/workspace/cases/" + cid));
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

test("consented chat memory survives navigation and can be turned off", async ({
  page,
}) => {
  await visit(page, "/support");
  await page
    .getByRole("button", {
      name: "Allow 24-hour conversation memory",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("24-hour memory on", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Your message", { exact: true })
    .fill("Synthetic test: I want a small next step.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".message.assistant")).toHaveCount(1);
  await visit(page, "/resources");
  await visit(page, "/support");
  await expect(
    page.getByText("Synthetic test: I want a small next step.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Turn off & delete saved memory",
      exact: true,
    })
    .click();
  await expect(page.getByText("Memory off", { exact: true })).toBeVisible();
  await visit(page, "/resources");
  await visit(page, "/support");
  await expect(page.locator(".message")).toHaveCount(0);
});

test("neutral reading cover is the default on every entry and after closing tools", async ({
  page,
}) => {
  const calls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/")) calls.push(request.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "More joy in the little things." }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Everyday Notes — Ideas for everyday living");
  await expect(page.locator(".private-shell")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Help options/ })).toHaveCount(
    0,
  );
  expect(calls).toEqual([]);
  await page.getByRole("button", { name: "At home", exact: true }).click();
  await expect(page.locator(".story-card")).toHaveCount(1);
  await page.getByRole("button", { name: /At home.*A little green/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "A little green goes a long way.",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to stories", exact: true })
    .click();
  await visit(page, "/studio");
  await page.getByRole("link", { name: "Support chat", exact: true }).click();
  await expect(page.getByLabel("Your message", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Get help", exact: true }).click();
  await expect(
    page.getByLabel("What’s on your mind?", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("What’s on your mind?")
    .fill("Synthetic private draft that must disappear");
  await page
    .getByRole("button", { name: "Back to reading", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "More joy in the little things." }),
  ).toBeVisible();
  await expect(page.locator("textarea")).toHaveCount(0);
  await page.goto("/journal");
  await expect(
    page.getByRole("heading", { name: "More joy in the little things." }),
  ).toBeVisible();
  await expect(page.getByLabel("Your message", { exact: true })).toHaveCount(0);
  await expect(page).toHaveTitle("Everyday Notes — Ideas for everyday living");
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});

test("double Escape covers private tools and reload keeps them covered", async ({
  page,
}) => {
  await visit(page, "/journal");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("Synthetic unsent private chat");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.locator(".private-shell")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "More joy in the little things." }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".private-shell")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "More joy in the little things." }),
  ).toBeVisible();
});

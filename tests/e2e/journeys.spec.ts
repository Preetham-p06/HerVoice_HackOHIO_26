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
  await expect(page).toHaveTitle("Everyday Notes — Ideas for everyday living");
}

test("guest image request → verified intake → real case event", async ({
  page,
}) => {
  await visit(page, "/studio");
  await page
    .getByLabel("What’s on your mind?")
    .fill("Synthetic test: I would like to explore housing support. नमस्ते ❤️");
  await expect(page.getByLabel("Safe contact preference")).toHaveValue("none");
  await page.getByLabel("City or region (optional)").fill("Synthetic city");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const approved = "Approved synthetic test message. नमस्ते ❤️";
  await page.getByLabel("Approved message").fill(approved);
  await page
    .getByRole("button", { name: "Generate Images", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "Generated image option 1" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Selected generated post image" }),
  ).toBeVisible();
  await page.getByLabel("Submission destination").selectOption("image");
  await page.getByRole("button", { name: "Finish preparing image" }).click();
  await page.getByRole("link", { name: "View receipt and image" }).click();
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
  await visit(page, "/account");
  await page.getByRole("button", { name: "Open demo workspace" }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await visit(page, "/workspace/intake");
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
    "/studio",
    "/journal",
    "/library",
    "/collections",
    "/about",
    "/account",
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
  await visit(page, "/studio");
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
  await visit(page, "/library");
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
  await visit(page, "/collections");
  await expect(page.getByLabel("Location", { exact: true })).toHaveValue(
    "United States",
  );
  await expect(page.getByText("India Code", { exact: true })).toHaveCount(0);
});

test("consented chat memory survives navigation and can be turned off", async ({
  page,
}) => {
  await visit(page, "/journal");
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
  await visit(page, "/collections");
  await visit(page, "/journal");
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
  await visit(page, "/collections");
  await visit(page, "/journal");
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
  await page
    .getByRole("button", { name: "Personal space", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: "Choose what you need.", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect(
    page.getByRole("dialog", { name: "Choose what you need.", exact: true }),
  ).not.toBeVisible();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-covering",
    "true",
  );
  await page.getByRole("button", { name: "At home", exact: true }).click();
  await expect(page.locator(".story-card")).toHaveCount(1);
  await page.locator(".story-card").click();
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
  await page.getByRole("link", { name: "Therapy bot", exact: true }).click();
  await expect(page.getByLabel("Your message", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Create a post", exact: true }).click();
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

test("highlighted note opens the five-page hackathon demo directly", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".reading-clue mark")).toHaveText([
    "Click",
    "the",
    "button",
    "below",
    "for",
    "help",
  ]);
  await page
    .getByRole("button", { name: "Open personal space", exact: true })
    .click();
  await expect(page.locator(".private-shell")).toBeVisible();
  const nav = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });
  await expect(nav.getByRole("link")).toHaveText([
    "Home",
    "Create a post",
    "Law bot",
    "Therapy bot",
    "Dashboard",
  ]);
  await nav.getByRole("link", { name: "Create a post", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Create a post.", exact: true }),
  ).toBeVisible();
  await nav.getByRole("link", { name: "Law bot", exact: true }).click();
  await expect(
    page.getByLabel("What would you like to understand?"),
  ).toBeVisible();
  await nav.getByRole("link", { name: "Therapy bot", exact: true }).click();
  await expect(page.getByLabel("Your message", { exact: true })).toBeVisible();
  await nav.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Live dashboard", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("5 sec", { exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-app-ready", "true");
});

test("dashboard columns, row actions, related dialog and companion zoom", async ({
  page,
}) => {
  await visit(page, "/workspace");
  await expect(
    page.getByRole("heading", { name: "Live dashboard" }),
  ).toBeVisible();
  await page.locator(".column-picker summary").click();
  await page.getByLabel("Location", { exact: true }).uncheck();
  await expect(
    page.getByRole("columnheader", { name: "Location", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Location", { exact: true }).check();
  await expect(
    page.getByRole("columnheader", { name: "Location", exact: true }),
  ).toBeVisible();
  await page.locator(".row-actions summary").first().click();
  await page.locator(".row-actions[open]").getByRole("link").click();
  await expect(
    page.getByRole("heading", { name: "Preferred way of contact" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Find Match", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Related report information" }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Therapy bot", exact: true }).click();
  await expect(
    page.getByRole("img", { name: /Maya, an original/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Zoom in companion" }).click();
  await expect(
    page.getByRole("button", { name: "Zoom out companion" }),
  ).toBeVisible();
});

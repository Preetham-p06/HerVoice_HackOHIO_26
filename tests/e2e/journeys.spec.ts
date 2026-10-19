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
  await expect(page).toHaveTitle(/^Everyday (Notes|Music|Books) — /);
}


async function conversationSettings(page: Page) {
  const settings = page.locator(".room-settings");
  if (!(await settings.evaluate(element => (element as HTMLDetailsElement).open))) {
    await settings.locator(":scope > summary").click();
  }
}

test("guest image request → verified intake → real case event", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 39.9612, longitude: -82.9988 });
  await visit(page, "/studio");
  await page
    .getByLabel("What’s on your mind?")
    .fill("Synthetic test: I would like to explore housing support. नमस्ते ❤️");
  await expect(page.getByLabel("Safe contact preference")).toHaveValue("none");
  await page
    .getByRole("button", { name: "Use my location", exact: true })
    .click();
  await expect(page.getByLabel("City or region (optional)")).toHaveValue(
    "39.9612, -82.9988",
  );
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
  await expect(
    page.locator(".case-summary-grid").getByText("39.9612, -82.9988", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent Activities", exact: true })).toBeVisible();
  await expect(page.locator('iframe[title="Google map of reported location"]')).toHaveCount(0);
  // Verify the location-specific embed without sending case data to Google in CI.
  await page.route("https://www.google.com/maps?**", (route) => route.fulfill({
    contentType: "text/html",
    body: "<html><body>Synthetic map fixture</body></html>",
  }));
  await page.getByRole("button", { name: "Load Google map", exact: true }).click();
  await expect(page.locator('iframe[title="Google map of reported location"]')).toHaveAttribute(
    "src", "https://www.google.com/maps?q=39.9612%2C%20-82.9988&z=14&output=embed",
  );
  await page
    .getByLabel("Private case note")
    .fill("Synthetic test note: review completed.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByText("Synthetic test note: review completed.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to cases", exact: true }).click();
  await expect(page).toHaveURL(/\/workspace\/cases$/);
  await page.locator(`a[href="/workspace/cases/${cid}"]`).first().click();
  await expect(page).toHaveURL(new RegExp("/workspace/cases/" + cid));
  await expect(page.getByRole("heading", { name: "Reported location", exact: true })).toBeVisible();
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
  await conversationSettings(page);
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
  await conversationSettings(page);
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
    page.getByRole("heading", { name: /More joy in the little things\.|Good music\. A little discovery\.|Small moments\. Good books\./ }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/^Everyday (Notes|Music|Books) — /);
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
    page.getByRole("heading", { name: /More joy in the little things\.|Good music\. A little discovery\.|Small moments\. Good books\./ }),
  ).toBeVisible();
  await expect(page.locator("textarea")).toHaveCount(0);
  await page.goto("/journal");
  await expect(
    page.getByRole("heading", { name: /More joy in the little things\.|Good music\. A little discovery\.|Small moments\. Good books\./ }),
  ).toBeVisible();
  await expect(page.getByLabel("Your message", { exact: true })).toHaveCount(0);
  await expect(page).toHaveTitle(/^Everyday (Notes|Music|Books) — /);
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
    page.getByRole("heading", { name: /More joy in the little things\.|Good music\. A little discovery\.|Small moments\. Good books\./ }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".private-shell")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /More joy in the little things\.|Good music\. A little discovery\.|Small moments\. Good books\./ }),
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
    page.getByRole("heading", { name: "A little support starts with your words.", exact: true }),
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
    page.getByRole("dialog", { name: "Reported person matches" }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Therapy bot", exact: true }).click();
  await expect(
    page.locator(".companion"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Zoom in companion" }).click();
  await expect(
    page.getByRole("button", { name: "Zoom out companion" }),
  ).toBeVisible();
});

test("structured brief → image → monitored signal → verified dashboard case", async ({
  page,
}) => {
  await page.route("**/api/v1/drafts", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.details.duration).toBe("5 months");
    expect(body.details.frequency).toBe("9 times per month");
    await route.fulfill({
      json: {
        text: "Synthetic reviewed report for a housing conversation.",
        provider: "Synthetic test writing fixture",
      },
    });
  });
  await visit(page, "/studio");
  await page
    .getByLabel("What’s on your mind?")
    .fill("Synthetic housing support");
  await page
    .getByLabel("How long has this been happening? (optional)")
    .press("Home");
  for (let i = 0; i < 5; i++)
    await page
      .getByLabel("How long has this been happening? (optional)")
      .press("ArrowRight");
  await page.getByLabel("Frequency of incidents (optional)").press("Home");
  for (let i = 0; i < 9; i++)
    await page
      .getByLabel("Frequency of incidents (optional)")
      .press("ArrowRight");
  await page
    .getByRole("button", { name: "Generate Text", exact: true })
    .click();
  await expect(page.getByLabel("Approved message")).toHaveValue(
    "Synthetic reviewed report for a housing conversation.",
  );
  await page
    .getByRole("button", { name: "Generate Images", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "Generated image option 1" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Submission destination").selectOption("feed");
  await page
    .getByRole("button", { name: "Send demo signal", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your demo signal is queued." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Watch the signal reach the dashboard" })
    .click();
  await page.getByRole("button", { name: "Scan now", exact: true }).click();
  await expect(
    page.getByRole("link", { name: /Open verified case/ }).first(),
  ).toBeVisible();
});

test("location denial has manual fallback and a remove control", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (
          _success: unknown,
          failure: (error: unknown) => void,
        ) => failure({ code: 1, message: "Denied in synthetic test" }),
      },
    });
  });
  await visit(page, "/studio");
  await page
    .getByRole("button", { name: "Use my location", exact: true })
    .click();
  await expect(page.getByRole("status").filter({ hasText: "Location permission" })).toContainText("denied or timed out");
  await page
    .getByLabel("City or region (optional)")
    .fill("Columbus, Ohio (synthetic)");
  await page
    .getByRole("button", { name: "Remove location", exact: true })
    .click();
  await expect(page.getByLabel("City or region (optional)")).toHaveValue("");
});

test("voice dictation stays editable until Send is chosen", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => ({ getTracks: () => [{ stop: () => {} }] }),
      },
    });
    class FakeRecorder {
      static isTypeSupported() {
        return true;
      }
      state = "inactive";
      mimeType = "audio/webm";
      onstop: (() => void) | null = null;
      ondataavailable: ((e: { data: Blob }) => void) | null = null;
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({
          data: new Blob(["synthetic clip"], { type: this.mimeType }),
        });
        this.onstop?.();
      }
    }
    Object.defineProperty(window, "MediaRecorder", {
      configurable: true,
      value: FakeRecorder,
    });
  });
  await page.route("**/api/v1/support/transcribe", (route) =>
    route.fulfill({ json: { text: "Synthetic voice note to review." } }),
  );
  await visit(page, "/journal");
  await page
    .getByRole("button", { name: "Speak your message", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Stop recording", exact: true })
    .click();
  await expect(page.getByLabel("Your message", { exact: true })).toHaveValue(
    "Synthetic voice note to review.",
  );
  await expect(page.locator(".message.you")).toHaveCount(0);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".message.assistant")).toBeVisible();
  await expect.poll(() => page.locator(".therapy-scene").evaluate(element => element.scrollTop)).toBe(0);
  await expect(
    page.getByRole("button", { name: "Listen to reply", exact: true }),
  ).toBeEnabled();
});

test("microphone denial preserves a typed message", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          throw new DOMException(
            "Synthetic permission denial",
            "NotAllowedError",
          );
        },
      },
    });
  });
  await visit(page, "/journal");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("Synthetic words already typed.");
  await page
    .getByRole("button", { name: "Speak your message", exact: true })
    .click();
  await expect(page.getByRole("alert").filter({ hasText: "Microphone permission" })).toContainText(
    "Microphone permission wasn’t granted",
  );
  await expect(page.getByLabel("Your message", { exact: true })).toHaveValue(
    "Synthetic words already typed.",
  );
});


test("companion controls and survivor-focused starters stay optional", async ({ page }) => {
  await visit(page, "/journal");
  await expect(page.getByRole("img", { name: "Maya, an animated 3D AI companion", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause animation", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Speak replies: off", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Speak replies: off", exact: true }).click();
  await expect(page.getByRole("button", { name: "Speak replies: on", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Speak replies: on", exact: true }).click();
  await conversationSettings(page);
  await page.locator(".room-prompts > summary").click();
  await page.getByRole("button", { name: "I’m blaming myself for what happened.", exact: true }).click();
  await expect(page.getByLabel("Your message", { exact: true })).toHaveValue("I’m blaming myself for what happened.");
  await expect(page.locator(".message.you")).toHaveCount(0);
  await page.locator(".room-settings > summary").click();
  const stillControl = page.getByRole("button", { name: "Show still image", exact: true });
  if (await stillControl.isVisible()) await stillControl.click();
  await expect(page.getByRole("img", { name: /Maya, an original illustrated/ })).toBeVisible();
  await conversationSettings(page);
  await page.getByRole("button", { name: "Text only", exact: true }).click();
  await expect(page.locator(".companion")).toHaveCount(0);
  await expect(page.getByLabel("Your message", { exact: true })).toHaveValue("I’m blaming myself for what happened.");
});

test("failed memory deletion does not falsely show memory off", async ({ page }) => {
  await visit(page, "/journal");
  await conversationSettings(page);
  await page.getByRole("button", { name: "Allow 24-hour conversation memory", exact: true }).click();
  await expect(page.getByText("24-hour memory on", { exact: true })).toBeVisible();
  await page.route("**/api/v1/support/memory", route => route.request().method() === "DELETE" ? route.fulfill({status:503,json:{message:"Synthetic storage failure"}}) : route.continue());
  await conversationSettings(page);
  await page.getByRole("button", { name: "Clear conversation", exact: true }).click();
  await expect(page.getByRole("alert").filter({hasText:"Could not delete saved memory"})).toBeVisible();
  await expect(page.getByText("24-hour memory on", { exact: true })).toBeVisible();
});


test("avatar studio keeps conversation history optional without losing the draft", async ({ page }) => {
  await visit(page, "/journal");
  await expect(page.locator(".room-settings")).not.toHaveAttribute("open");
  await page.getByLabel("Your message", { exact: true }).fill("Synthetic studio draft.");
  await page.getByRole("button", { name: "Show conversation", exact: true }).click();
  await expect(page.locator(".chatbody")).toBeVisible();
  await page.getByRole("button", { name: "Hide conversation", exact: true }).click();
  await expect(page.locator(".chatbody")).toBeHidden();
  await page.getByRole("button", { name: "Show conversation", exact: true }).click();
  await expect(page.getByLabel("Your message", { exact: true })).toHaveValue("Synthetic studio draft.");
  await expect(page.getByRole("link", {name:"Avatar credits",exact:true})).toHaveAttribute("href","/models/maya-reference.LICENSE.txt");
});


test("expanded companion view preserves the draft and exits with Escape", async ({ page }) => {
  await visit(page, "/journal");
  await page.getByLabel("Your message", { exact: true }).fill("Synthetic presentation draft.");
  await page.getByRole("button", { name: "Expand companion", exact: true }).click();
  await expect(page.getByRole("dialog", { name:"Your space with Maya.", exact:true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".expanded-room")).toHaveCount(0);
  await expect(page.getByLabel("Your message", { exact:true })).toHaveValue("Synthetic presentation draft.");
});


test("cover editions rotate across reloads with a consistent highlighted entry", async ({ page }) => {
  await page.goto("/");
  for (const name of ["notes", "music", "books", "notes"]) {
    await expect(page.locator(".everyday-brand")).toContainText(name);
    await expect(page.locator(".reading-clue mark")).toHaveText(["Click", "the", "button", "below", "for", "help"]);
    await expect(page.getByRole("button", { name: "Open personal space", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Read " + (name === "notes" ? "A little green goes a long way." : name === "music" ? "A softer start to the day." : "A few pages, just for you."), exact: true }).click();
    await expect(page.locator(".article-copy p")).toHaveCount(3);
    await page.getByRole("button", { name: "Back to stories", exact: true }).click();
    await page.getByRole("button", { name: "Open personal space", exact: true }).click();
    await expect(page.locator(".private-shell")).toBeVisible();
    await page.getByRole("button", { name: "Back to reading", exact: true }).click();
    await expect(page.locator(".everyday-brand")).toContainText(name);
    await page.reload();
  }
});

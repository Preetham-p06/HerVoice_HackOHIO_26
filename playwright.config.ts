import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "html",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  webServer: [
    {
      command:
        ".venv/bin/python -m uvicorn services.api.main:app --host 127.0.0.1 --port 8000",
      url: "http://127.0.0.1:8000/v1/health",
      reuseExistingServer: !process.env.CI,
      env: { APP_MODE: "demo", DATA_DIR: ".data/e2e" },
    },
    {
      command: process.env.CI
        ? "npm run start --workspace apps/web"
        : "npm run dev",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
});

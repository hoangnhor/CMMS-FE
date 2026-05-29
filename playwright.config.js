import { defineConfig } from "@playwright/test";
import { env } from "node:process";

const useManagedWebServers = env.CI === "true";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  fullyParallel: false,
  retries: 0,
  webServer: useManagedWebServers
    ? [
      {
        command: "npm --prefix ../backend run dev",
        url: "http://localhost:5000/api/health",
        reuseExistingServer: true,
        timeout: 120000,
        env: {
          REFRESH_JWT_SECRET: "playwright_refresh_secret_that_is_long_enough_123456",
        },
      },
      {
        command: "npm run dev -- --host 127.0.0.1 --port 5173",
        url: "http://localhost:5173/auth",
        reuseExistingServer: true,
        timeout: 120000,
      },
    ]
    : undefined,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});

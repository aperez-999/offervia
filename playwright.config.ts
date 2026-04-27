import { loadEnvConfig } from "@next/env";
import { defineConfig } from "@playwright/test";

loadEnvConfig(process.cwd());

const DEFAULT_PORT = 3000;
const configuredBaseURL = process.env.E2E_BASE_URL?.trim();
const baseURL = configuredBaseURL || `http://127.0.0.1:${DEFAULT_PORT}`;
const localPort = String(DEFAULT_PORT);

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: configuredBaseURL
    ? undefined
    : {
        command: `npm run dev -- --hostname 127.0.0.1 --port ${localPort}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});

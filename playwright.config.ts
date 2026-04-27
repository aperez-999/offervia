import { loadEnvConfig } from "@next/env";
import { defineConfig } from "@playwright/test";

loadEnvConfig(process.cwd());

const DEFAULT_PORT = 3000;
const configuredBaseURL = process.env.E2E_BASE_URL?.trim();
const baseURL = configuredBaseURL || `http://127.0.0.1:${DEFAULT_PORT}`;
const parsedBaseURL = new URL(baseURL);
const isLocalBaseURL = ["127.0.0.1", "localhost"].includes(parsedBaseURL.hostname);
const localHost = parsedBaseURL.hostname;
const localPort = parsedBaseURL.port || String(DEFAULT_PORT);

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: isLocalBaseURL
    ? {
        command: `npm run dev -- --hostname ${localHost} --port ${localPort}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});

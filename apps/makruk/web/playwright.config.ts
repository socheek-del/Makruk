import { defineConfig, devices } from '@playwright/test';

const PORT = 5174;
const WORKER_PORT = 8787;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: `npx vite --port ${PORT} --strictPort --host 127.0.0.1`,
      url: `http://127.0.0.1:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      // Online play needs the Worker + Durable Objects; a short reconnect grace keeps abandonment tests fast.
      command:
        `mkdir -p ../web/dist && npx wrangler d1 migrations apply makruk --local && ` +
        `npx wrangler dev --port ${WORKER_PORT} --ip 127.0.0.1 --var RECONNECT_GRACE_MS:3000 --var AUTH_SECRET:e2e-secret ` +
        `--var DEV_EMAIL_OUTBOX:1 --var PUBLIC_ORIGIN:http://127.0.0.1:${PORT}`,
      cwd: '../worker',
      url: `http://127.0.0.1:${WORKER_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { WRANGLER_SEND_METRICS: 'false' },
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

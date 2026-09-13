import path from 'node:path';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

// Tests run inside workerd with the real Durable Objects, WebSocket hibernation, alarms and D1.
export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: {
        bindings: {
          AUTH_SECRET: 'test-secret',
          RECONNECT_GRACE_MS: '200',
          PUBLIC_ORIGIN: 'https://th-chess.test',
          ALLOW_TEST_LOGIN: '1',
          GOOGLE_CLIENT_ID: 'test-google-client',
          GOOGLE_CLIENT_SECRET: 'test-google-secret',
          RESEND_API_KEY: 'test-resend-key',
          EMAIL_FROM: 'Makruk <noreply@beanroti.com>',
          TEST_MIGRATIONS: await readD1Migrations(path.join(import.meta.dirname, 'migrations')),
        },
      },
    })),
  ],
  test: {
    setupFiles: ['./test/apply-migrations.ts'],
  },
});

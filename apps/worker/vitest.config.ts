import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

// Tests run inside workerd with the real Durable Object, WebSocket hibernation and alarms.
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: {
        bindings: { AUTH_SECRET: 'test-secret', RECONNECT_GRACE_MS: '200' },
      },
    }),
  ],
});

import { describeLocales } from '@chaturanga/game-shell/testing';
import { PRODUCT } from '../../product.config';
import en from './en.json';
import th from './th.json';

const sources = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// i18n-001 / plat-004: every language in product.config.ts is complete.
describeLocales(PRODUCT, { th, en }, sources);

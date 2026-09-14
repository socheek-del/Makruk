import { describeLocales } from '@chaturanga/game-shell/testing';
import { PRODUCT } from '../../product.config';
import en from './en.json';
import my from './my.json';

const sources = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Every language Sittuyin declares is complete. Burmese is Unicode only — never Zawgyi.
describeLocales(PRODUCT, { my, en }, sources);

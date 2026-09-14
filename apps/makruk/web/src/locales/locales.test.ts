import { describe, expect, it } from 'vitest';
import en from './en.json';
import th from './th.json';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v !== null && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

const sources = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('locales', () => {
  it('Thai and English define exactly the same keys', () => {
    expect(keys(en).sort()).toEqual(keys(th).sort());
  });

  it('no translation is empty', () => {
    for (const [name, dict] of Object.entries({ th, en })) {
      const empty = keys(dict).filter((k) => {
        const value = k.split('.').reduce<unknown>((o, part) => (o as Record<string, unknown>)[part], dict);
        return typeof value !== 'string' || value.trim() === '';
      });
      expect(empty, name).toEqual([]);
    }
  });

  it('every literal t("key") used in source exists in both locales', () => {
    const defined = new Set(keys(th));
    const used = new Set<string>();
    for (const code of Object.values(sources)) {
      for (const match of code.matchAll(/\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g)) used.add(match[1]!);
    }
    expect(used.size).toBeGreaterThan(10);
    expect([...used].filter((k) => !defined.has(k))).toEqual([]);
  });
});

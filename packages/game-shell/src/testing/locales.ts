/**
 * Locale completeness (plat-004): every language a product declares must define exactly the default
 * language's keys, with no empty text, and every literal `t('key')` in the app's source must exist.
 */
import { describe, expect, it } from 'vitest';
import type { ProductConfig } from '../product';

export function flattenKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v !== null && typeof v === 'object' ? flattenKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

function valueAt(dict: object, key: string): unknown {
  return key.split('.').reduce<unknown>((o, part) => (o as Record<string, unknown> | undefined)?.[part], dict);
}

export interface LocaleProblems {
  /** Declared languages without a dictionary, and dictionaries for undeclared languages. */
  undeclared: string[];
  missingDictionaries: string[];
  /** Per language: keys the default language has but it lacks, and keys only it has. */
  missing: Record<string, string[]>;
  extra: Record<string, string[]>;
  empty: Record<string, string[]>;
}

/** Everything wrong with a product's dictionaries; all lists empty means complete. */
export function localeProblems<L extends string>(
  product: ProductConfig<L>,
  resources: Partial<Record<string, object>>,
): LocaleProblems {
  const declared = product.locales as readonly string[];
  const problems: LocaleProblems = {
    undeclared: Object.keys(resources).filter((l) => !declared.includes(l)),
    missingDictionaries: declared.filter((l) => !resources[l]),
    missing: {},
    extra: {},
    empty: {},
  };
  const reference = new Set(flattenKeys(resources[product.defaultLocale] ?? {}));
  for (const locale of declared) {
    const dict = resources[locale];
    if (!dict) continue;
    const keys = flattenKeys(dict);
    const own = new Set(keys);
    problems.missing[locale] = [...reference].filter((k) => !own.has(k));
    problems.extra[locale] = keys.filter((k) => !reference.has(k));
    problems.empty[locale] = keys.filter((k) => {
      const value = valueAt(dict, k);
      return typeof value !== 'string' || value.trim() === '';
    });
  }
  return problems;
}

/** Registers the locale completeness tests for a product. `sources` maps file names to source text. */
export function describeLocales<L extends string>(
  product: ProductConfig<L>,
  resources: Record<L, object>,
  sources: Record<string, string>,
): void {
  describe(`${product.id} locales (plat-004)`, () => {
    const problems = localeProblems(product, resources);

    it('has a dictionary, a language name and an Open Graph locale for exactly the declared languages', () => {
      expect(product.locales).toContain(product.defaultLocale);
      expect(problems.undeclared).toEqual([]);
      expect(problems.missingDictionaries).toEqual([]);
      expect(Object.keys(product.languageNames).sort()).toEqual([...product.locales].sort());
      expect(Object.keys(product.ogLocales).sort()).toEqual([...product.locales].sort());
    });

    it.each([...product.locales])('%s defines exactly the same keys as the default language, none empty', (locale) => {
      expect(problems.missing[locale], `missing in ${locale}`).toEqual([]);
      expect(problems.extra[locale], `only in ${locale}`).toEqual([]);
      expect(problems.empty[locale], `empty in ${locale}`).toEqual([]);
    });

    it('every literal t("key") used in source exists in every language', () => {
      const used = new Set<string>();
      for (const code of Object.values(sources)) {
        for (const match of code.matchAll(/\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g)) used.add(match[1]!);
      }
      expect(used.size).toBeGreaterThan(10);
      for (const locale of product.locales) {
        const defined = new Set(flattenKeys(resources[locale]));
        expect([...used].filter((k) => !defined.has(k)), locale).toEqual([]);
      }
    });
  });
}

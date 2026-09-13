import { describe, expect, it } from 'vitest';
import en from './en.json';
import th from './th.json';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v !== null && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('locales', () => {
  it('Thai and English define exactly the same keys', () => {
    expect(keys(en).sort()).toEqual(keys(th).sort());
  });
});

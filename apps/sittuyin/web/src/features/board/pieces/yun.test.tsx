// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PieceSvg } from '../PieceSvg';
import { SHAPES, YUN_PALETTE } from './yun';

afterEach(cleanup);

const TYPES = ['k', 'f', 's', 'n', 'r', 'p'] as const;

describe('yun piece set (sit-005)', () => {
  it('draws every Sittuyin piece type in both colours', () => {
    for (const type of TYPES) {
      for (const color of ['w', 'b'] as const) {
        const view = render(<PieceSvg piece={{ color, type, promoted: false }} />);
        const svg = view.container.querySelector('svg')!;
        expect(svg.dataset.set).toBe('yun');
        expect(svg.dataset.type).toBe(type);
        cleanup();
      }
    }
  });

  it('marks a promoted Ne so it is not mistaken for the original Sit-ke', () => {
    const plain = render(<PieceSvg piece={{ color: 'w', type: 'f', promoted: false }} />).container.innerHTML;
    cleanup();
    const promoted = render(<PieceSvg piece={{ color: 'w', type: 'f', promoted: true }} />).container.innerHTML;
    expect(promoted).not.toBe(plain);
    expect(promoted).toContain('ellipse');
  });

  it('gives every type its own silhouette, so pieces differ by outline alone at a 40px square', () => {
    const outlines = TYPES.map((type) => SHAPES[type]!.body.join(' '));
    expect(new Set(outlines).size).toBe(TYPES.length);
  });

  it('keeps both colours distinct from each other', () => {
    expect(YUN_PALETTE.w.body).not.toBe(YUN_PALETTE.b.body);
    expect(YUN_PALETTE.w.outline).not.toBe(YUN_PALETTE.b.outline);
  });
});

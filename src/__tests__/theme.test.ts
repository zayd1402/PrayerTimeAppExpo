/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';

import { C as lightC, darkC } from '../types';
type Tokens = typeof lightC;

function luminance(hex: string): number {
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [lo, hi] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (hi + 0.05) / (lo + 0.05);
}

const themes: [string, Tokens][] = [['light', lightC], ['dark', darkC]];

describe('theme tokens', () => {
  it('defines the same tokens in light and dark', () => {
    expect(Object.keys(darkC).sort()).toEqual(Object.keys(lightC).sort());
  });

  // Normal-size text needs 4.5:1 (WCAG AA).
  const textPairs: [keyof Tokens, keyof Tokens][] = [
    ['textPrimary', 'bgBase'],
    ['textSecondary', 'bgBase'],
    ['textMuted', 'bgBase'],
    ['textMuted', 'bgSurface'],
    ['gold', 'bgBase'],
    ['onPrimary', 'primary'],
    ['onHero', 'heroBg'],
    ['onHeroMuted', 'heroBg'],
  ];

  for (const [name, t] of themes) {
    for (const [fg, bg] of textPairs) {
      it(`${name}: ${String(fg)} on ${String(bg)} meets 4.5:1`, () => {
        expect(contrast(t[fg] as string, t[bg] as string)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

describe('screens follow the theme', () => {
  const dirs = ['screens', 'components', 'navigation'].map(d => path.join(__dirname, '..', d));
  const files = dirs.flatMap(d => fs.readdirSync(d).filter(f => f.endsWith('.tsx')).map(f => path.join(d, f)));

  it.each(files)('%s does not import the static light palette', file => {
    // Importing C from types freezes the light colours; screens must use useTokens or useThemedStyles.
    const src = fs.readFileSync(file, 'utf8');
    expect(src).not.toMatch(/import \{[^}]*\bC\b[^}]*\} from '\.\.\/types'/);
  });
});

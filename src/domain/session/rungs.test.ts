/**
 * Les paliers d'une échelle, tapés comme le coach les tape.
 */
import { describe, expect, it } from 'vitest';
import { parseRungs, rungsLine } from './rungs';

describe('la saisie libre des paliers', () => {
  it('tirets, espaces ou virgules, au choix', () => {
    expect(parseRungs('2-4-6-8')).toEqual([2, 4, 6, 8]);
    expect(parseRungs('2 4 6 8')).toEqual([2, 4, 6, 8]);
    expect(parseRungs('2,4,6,8')).toEqual([2, 4, 6, 8]);
  });

  it('mélangés, doublés, ou en point médian', () => {
    expect(parseRungs(' 2, 4  6-8 · 6 ')).toEqual([2, 4, 6, 8, 6]);
  });

  // Un zéro serait une marche vide.
  it('ce qui n’est pas un palier ne compte pas', () => {
    expect(parseRungs('0-5-abc-10')).toEqual([5, 10]);
    expect(parseRungs('')).toEqual([]);
  });

  it('ce qui se relit sous le champ', () => {
    expect(rungsLine([2, 4, 6, 8])).toBe('2 · 4 · 6 · 8 — 4 paliers');
    expect(rungsLine([10])).toBe('10 — 1 palier');
    expect(rungsLine([])).toBe('aucun palier');
  });
});

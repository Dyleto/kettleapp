import { describe, expect, it } from 'vitest';
import { chipTime, markCount, readAmrap, roundTarget } from './amrap';

describe('roundTarget', () => {
  it('lit un écart écrit avec un tiret, comme dans le décor', () => {
    expect(roundTarget('Rythme régulier, viser 5-6 tours')).toEqual({
      low: 5,
      high: 6,
    });
  });

  it('lit « 5 à 6 tours » et remet un écart à l’envers dans l’ordre', () => {
    expect(roundTarget('vise 5 à 6 tours')).toEqual({ low: 5, high: 6 });
    expect(roundTarget('6 ou 5 tours')).toEqual({ low: 5, high: 6 });
  });

  it('lit un nombre seul', () => {
    expect(roundTarget('Au moins 4 tours propres')).toEqual({
      low: 4,
      high: 4,
    });
  });

  it('ne prend pas une charge ou des répétitions pour un objectif', () => {
    expect(roundTarget('Kettlebell de 20 kg, 3 × 10 swings')).toBeNull();
    expect(roundTarget(undefined)).toBeNull();
  });
});

describe('markCount', () => {
  it('dessine six repères quand rien ne dit mieux', () => {
    expect(markCount(null, 2)).toBe(6);
  });

  it("s'étend à l'objectif et à ce qui est déjà fait", () => {
    expect(markCount({ low: 7, high: 8 }, 3)).toBe(8);
    expect(markCount({ low: 5, high: 6 }, 9)).toBe(9);
  });
});

describe('readAmrap', () => {
  it('descend avec une durée, et garde la seconde entamée', () => {
    expect(readAmrap(720, 0)).toEqual({ seconds: 720, finished: false });
    expect(readAmrap(720, 228_250)).toEqual({ seconds: 492, finished: false });
    expect(readAmrap(720, 719_001)).toEqual({ seconds: 1, finished: false });
  });

  it("se dit fini à l'instant où la durée tombe", () => {
    expect(readAmrap(720, 720_000)).toEqual({ seconds: 0, finished: true });
    expect(readAmrap(720, 900_000)).toEqual({ seconds: 0, finished: true });
  });

  it('monte sans durée, et ne finit jamais seul', () => {
    expect(readAmrap(undefined, 999)).toEqual({ seconds: 0, finished: false });
    expect(readAmrap(undefined, 192_400)).toEqual({
      seconds: 192,
      finished: false,
    });
  });
});

describe('chipTime', () => {
  it('écrit les minutes sur deux chiffres', () => {
    expect(chipTime(492)).toBe('08:12');
    expect(chipTime(600)).toBe('10:00');
    expect(chipTime(599)).toBe('09:59');
    expect(chipTime(0)).toBe('00:00');
  });
});

import { describe, expect, it } from 'vitest';
import {
  countWord,
  daysDone,
  doneInWeek,
  weekStreak,
  weekTarget,
} from './weekRing';
import { makeSession } from './fixtures';

// Un jeudi : la semaine court du lundi 7 au dimanche 13 septembre 2026.
const THURSDAY = new Date(2026, 8, 10, 18, 0);
const at = (day: number, month = 8) => ({
  completedAt: new Date(2026, month, day, 9, 0).toISOString(),
});

describe('weekTarget', () => {
  it('compte les jours conseillés distincts du programme', () => {
    expect(
      weekTarget([
        makeSession({ _id: 'a', suggestedDays: [0, 3] }),
        makeSession({ _id: 'b', suggestedDays: [3, 5] }),
      ])
    ).toBe(3);
  });

  it('vaut zéro quand rien n’est conseillé', () => {
    expect(weekTarget([makeSession({ suggestedDays: [] })])).toBe(0);
  });
});

describe('doneInWeek', () => {
  it('compte depuis lundi, et seulement cette semaine', () => {
    expect(doneInWeek([at(7), at(9), at(6), at(14)], THURSDAY)).toBe(2);
  });
});

describe('weekStreak', () => {
  it('compte les semaines pleines à la suite', () => {
    // Deux par semaine les trois semaines d'avant, celle-ci pas finie.
    const history = [at(2), at(4), at(24, 7), at(28, 7), at(17, 7), at(20, 7)];
    expect(weekStreak(history, 2, THURSDAY)).toBe(3);
  });

  it('ajoute la semaine en cours dès qu’elle est pleine', () => {
    const history = [at(31, 7), at(2), at(7), at(9)];
    expect(weekStreak(history, 2, THURSDAY)).toBe(2);
  });

  it('s’arrête à la première semaine qui n’a pas tenu', () => {
    const history = [at(2), at(4), at(24, 7)];
    expect(weekStreak(history, 2, THURSDAY)).toBe(1);
  });

  it('sans jour conseillé, une séance par semaine suffit', () => {
    expect(weekStreak([at(3), at(26, 7), at(7)], 0, THURSDAY)).toBe(3);
  });
});

describe('countWord', () => {
  it('écrit les petits comptes en lettres', () => {
    expect([countWord(1), countWord(3), countWord(12)]).toEqual([
      'une',
      'trois',
      '12',
    ]);
  });
});

describe('daysDone', () => {
  it('donne les jours faits de cette semaine, lundi = 0', () => {
    expect([...daysDone([at(7), at(10), at(6)], THURSDAY)].sort()).toEqual([
      0, 3,
    ]);
  });
});

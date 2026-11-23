import { describe, expect, it } from 'vitest';
import {
  countWord,
  daysDone,
  doneInWeek,
  parseSeenRing,
  ringStart,
  weekKey,
  weekStreak,
  weekTarget,
} from './ring';
import { makeSession } from '@/domain/fixtures';

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

describe('ringStart', () => {
  const week = weekKey(THURSDAY);

  it('part de ce qui était vu cette semaine quand ça a changé', () => {
    expect(ringStart({ week, part: 1 / 3 }, { week, part: 2 / 3 })).toBe(1 / 3);
  });

  it('ne bouge pas quand rien n’a changé', () => {
    expect(
      ringStart({ week, part: 2 / 3 }, { week, part: 2 / 3 })
    ).toBeUndefined();
  });

  it('ne bouge pas la première fois : il n’y a rien à raconter', () => {
    expect(ringStart(null, { week, part: 2 / 3 })).toBeUndefined();
  });

  it('une autre semaine repart de son compte, sans se vider sous les yeux', () => {
    const before = weekKey(new Date(2026, 8, 3, 9));
    expect(before).not.toBe(week);
    expect(
      ringStart({ week: before, part: 1 }, { week, part: 0 })
    ).toBeUndefined();
  });

  it('redescend quand un jour conseillé s’ajoute', () => {
    expect(ringStart({ week, part: 1 }, { week, part: 0.75 })).toBe(1);
  });

  it('une mémoire hors de l’anneau est ramenée dedans', () => {
    expect(ringStart({ week, part: 1.5 }, { week, part: 0.5 })).toBe(1);
  });
});

describe('weekKey', () => {
  it('est la même du lundi au dimanche, et change le lundi suivant', () => {
    expect(weekKey(new Date(2026, 8, 7, 0, 5))).toBe(weekKey(THURSDAY));
    expect(weekKey(new Date(2026, 8, 13, 23, 55))).toBe(weekKey(THURSDAY));
    expect(weekKey(new Date(2026, 8, 14, 0, 5))).not.toBe(weekKey(THURSDAY));
  });
});

describe('parseSeenRing', () => {
  it('relit ce qui a été écrit', () => {
    expect(
      parseSeenRing(JSON.stringify({ week: '2026-09-07', part: 0.5 }))
    ).toEqual({ week: '2026-09-07', part: 0.5 });
  });

  it('ce qui n’a pas la forme attendue vaut l’absence', () => {
    expect(parseSeenRing(null)).toBeNull();
    expect(parseSeenRing('')).toBeNull();
    expect(parseSeenRing('{')).toBeNull();
    expect(parseSeenRing('3')).toBeNull();
    expect(parseSeenRing('null')).toBeNull();
    expect(parseSeenRing(JSON.stringify({ week: 1, part: 0.5 }))).toBeNull();
    expect(parseSeenRing(JSON.stringify({ week: 'x', part: 'a' }))).toBeNull();
    expect(parseSeenRing(JSON.stringify({ week: 'x', part: null }))).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { clockFace, readClock, roundStart, type TimedPlan } from './clock';

const emom: TimedPlan = { work: 60, rest: 0, rounds: 10 };
const tabata: TimedPlan = { work: 20, rest: 10, rounds: 8 };

describe('readClock', () => {
  it("lit le premier tour plein à l'origine", () => {
    expect(readClock(emom, 0)).toEqual({
      round: 1,
      phase: 'work',
      remaining: 60,
      length: 60,
      finished: false,
    });
  });

  it('garde la seconde entamée, comme secondsLeft', () => {
    expect(readClock(emom, 250).remaining).toBe(60);
    expect(readClock(emom, 59_001).remaining).toBe(1);
  });

  it("passe au tour suivant à l'instant exact où la minute tombe", () => {
    expect(readClock(emom, 59_999).round).toBe(1);
    expect(readClock(emom, 60_000)).toMatchObject({ round: 2, remaining: 60 });
  });

  it('retrouve le tour réel après trois minutes sans battre', () => {
    // Le téléphone verrouillé : aucun battement pendant trois minutes, et la
    // lecture suivante doit dire le tour 4, pas reprendre le tour 1.
    expect(readClock(emom, 3 * 60_000 + 18_000)).toMatchObject({
      round: 4,
      remaining: 42,
    });
  });

  it('enchaîne travail puis repos dans un tour de Tabata', () => {
    expect(readClock(tabata, 19_500)).toMatchObject({
      round: 1,
      phase: 'work',
      remaining: 1,
      length: 20,
    });
    expect(readClock(tabata, 20_000)).toMatchObject({
      round: 1,
      phase: 'rest',
      remaining: 10,
      length: 10,
    });
    expect(readClock(tabata, 30_000)).toMatchObject({
      round: 2,
      phase: 'work',
      remaining: 20,
    });
  });

  it("n'invente pas de repos quand le bloc n'en impose pas", () => {
    const noRest: TimedPlan = { work: 40, rest: 0, rounds: 3 };
    expect(readClock(noRest, 40_000)).toMatchObject({
      round: 2,
      phase: 'work',
    });
  });

  it('se dit fini au bout du dernier tour, sans afficher un tour de trop', () => {
    expect(readClock(emom, 600_000)).toMatchObject({
      round: 10,
      remaining: 0,
      finished: true,
    });
    expect(readClock(tabata, 8 * 30_000 + 5_000)).toMatchObject({
      round: 8,
      phase: 'rest',
      finished: true,
    });
  });

  it("ramène un instant d'avant l'origine au début du bloc", () => {
    expect(readClock(emom, -500)).toMatchObject({ round: 1, remaining: 60 });
  });
});

describe('roundStart', () => {
  it('place chaque tour à un intervalle du précédent', () => {
    expect(roundStart(emom, 1)).toBe(0);
    expect(roundStart(emom, 4)).toBe(180_000);
    expect(roundStart(tabata, 3)).toBe(60_000);
  });

  it('borne le tour demandé au bloc', () => {
    expect(roundStart(emom, 0)).toBe(0);
    expect(roundStart(emom, 12)).toBe(540_000);
  });

  it('est relu par readClock comme le début du tour', () => {
    expect(readClock(tabata, roundStart(tabata, 5))).toMatchObject({
      round: 5,
      phase: 'work',
      remaining: 20,
    });
  });
});

describe('clockFace', () => {
  it("garde la forme d'un cadran sous la minute, sur un EMOM", () => {
    expect(clockFace(readClock(emom, 0), false)).toBe('1:00');
    expect(clockFace(readClock(emom, 18_000), false)).toBe('0:42');
    expect(clockFace(readClock(emom, 57_500), false)).toBe('0:03');
  });

  it('écrit la phase courte en deux chiffres, sur un Tabata', () => {
    expect(clockFace(readClock(tabata, 6_000), true)).toBe('14');
    expect(clockFace(readClock(tabata, 23_000), true)).toBe('07');
  });

  it('repasse au cadran quand la phase dépasse deux chiffres', () => {
    const long: TimedPlan = { work: 120, rest: 30, rounds: 4 };
    expect(clockFace(readClock(long, 30_000), true)).toBe('1:30');
  });
});

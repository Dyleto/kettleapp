/**
 * Le score d'un bloc qui se compte, sous lui dans l'atelier : les tours, le
 * palier, les mouvements, et en combien de temps.
 */
import { describe, expect, it } from 'vitest';
import type { BlockSnapshot } from '@/shared/types';
import {
  makeBlock,
  makeBlockSnapshot,
  makeCompleted,
  makeExerciseSnapshot,
  makeSession,
} from '@/domain/fixtures';
import { blockScores, scoreLine } from './blockScore';

const amrap = (performedRounds?: number) =>
  makeBlockSnapshot({ type: 'amrap', performedRounds });
const ladder = (performedRungs: number, performedSeconds?: number) =>
  makeBlockSnapshot({
    type: 'ladder',
    repsScheme: [1, 2, 3, 4, 5, 6, 7],
    performedRungs,
    performedSeconds,
  });
const chipper = (performedMovements: number, performedSeconds?: number) =>
  makeBlockSnapshot({
    type: 'chipper',
    exercises: [1, 2, 3, 4, 5].map((order) => makeExerciseSnapshot({ order })),
    performedMovements,
    performedSeconds,
  });

describe('les tours', () => {
  it('« Tours bouclés : 4, 5, 5 », sur les trois derniers passages', () => {
    expect(scoreLine([3, 4, 5, 5].map(amrap))).toEqual({
      line: 'Tours bouclés : 4, 5, 5.',
      tone: 'plain',
    });
  });

  it('qui montent, qui baissent', () => {
    expect(scoreLine([4, 5].map(amrap))?.tone).toBe('up');
    expect(scoreLine([5, 4].map(amrap))?.tone).toBe('warn');
  });

  // Un EMOM a des tours demandés : on dit sur combien.
  it('un format à tours fixes dit sur combien', () => {
    const emom = (performedRounds: number) =>
      makeBlockSnapshot({ type: 'emom', rounds: 10, performedRounds });
    expect(scoreLine([8, 10].map(emom))?.line).toBe(
      'Tours faits : 8, 10 sur 10.'
    );
  });

  it('un passage sans score ne compte pas', () => {
    expect(scoreLine([amrap(4), amrap(undefined)])?.line).toBe(
      'Tours bouclés : 4.'
    );
    expect(scoreLine([amrap(undefined)])).toBeUndefined();
  });
});

describe('l’échelle', () => {
  it('« Palier 5 sur 7 en 12:00 », et le passage d’avant', () => {
    expect(scoreLine([ladder(4, 700), ladder(5, 720)])).toEqual({
      line: 'Palier 5 sur 7 en 12:00. Avant : 4 sur 7.',
      tone: 'up',
    });
  });

  it('bouclée', () => {
    expect(scoreLine([ladder(7, 540)])?.line).toBe('Échelle bouclée en 9:00.');
  });
});

describe('le chipper', () => {
  it('fini, et en combien de temps', () => {
    expect(scoreLine([chipper(5, 580)])?.line).toBe('Fini en 9:40.');
  });

  it('pas fini : combien de mouvements', () => {
    expect(scoreLine([chipper(4, 720)])?.line).toBe(
      '4 mouvements sur 5 en 12:00.'
    );
  });

  // Deux listes finies se comparent au temps : plus vite, c'est mieux.
  it('fini plus vite que la dernière fois', () => {
    expect(scoreLine([chipper(5, 600), chipper(5, 580)])?.tone).toBe('up');
    expect(scoreLine([chipper(5, 580), chipper(5, 600)])?.tone).toBe('warn');
  });
});

describe('les blocs de la séance', () => {
  // Le premier AMRAP répond au premier AMRAP, quelle que soit sa place.
  it('un bloc se retrouve par son format et son rang, pas par sa place', () => {
    const session = makeSession({
      blocks: [
        makeBlock({ _id: 'echauffement', type: 'warmup' }),
        makeBlock({ _id: 'a', type: 'amrap' }),
        makeBlock({ _id: 'b', type: 'amrap' }),
      ],
    });
    const passage = (rounds: [number, number], day: number) =>
      makeCompleted({
        _id: `bilan-${day}`,
        completedAt: `2026-09-0${day}T10:00:00.000Z`,
        blocks: [
          { ...amrap(rounds[0]), order: 1 },
          { ...amrap(rounds[1]), order: 2 },
        ] as BlockSnapshot[],
      });
    const scores = blockScores(session, [
      passage([3, 7], 1),
      passage([4, 8], 2),
    ]);
    expect(scores.get('a')?.line).toBe('Tours bouclés : 3, 4.');
    expect(scores.get('b')?.line).toBe('Tours bouclés : 7, 8.');
    expect(scores.has('echauffement')).toBe(false);
  });

  it('rien pour une séance jamais faite', () => {
    expect(blockScores(makeSession(), []).size).toBe(0);
  });
});

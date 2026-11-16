/**
 * Le constat de fin de séance.
 *
 * Il existe pour inverser l'arc d'une séance : quarante minutes d'effort
 * menaient à un formulaire, puis à un second, puis à un toast. On demandait
 * deux fois avant de donner quoi que ce soit.
 *
 * Trois de ses chiffres se calculent, et chacun peut mentir dans un sens qui
 * blesse. Le tonnage, en inventant des répétitions que personne n'a faites.
 * Le compte de séries, en annonçant « 7 sur 15 » à quelqu'un qui vient de
 * tout faire. La durée, en additionnant une nuit de sommeil. Ce sont ces
 * trois frontières que ce fichier fixe.
 */
import { describe, expect, it } from 'vitest';
import { allowedReps, buildRecap, countSets, tonnageOf } from './recap';
import { buildGuidedSteps } from './guidedSteps';
import { performedKey } from '@/domain/history/lastPerformance';
import { makeBlock, makeBlockExercise, makeSession } from '@/domain/fixtures';
import type { PerformedValues } from '@/shared/types';

const KEY = performedKey(1, 1);

describe('le tonnage', () => {
  it('multiplie la charge par les répétitions tapées', () => {
    const performed: Record<string, PerformedValues> = {
      [KEY]: { sets: [{ weight: 26, reps: 10 }] },
    };
    expect(tonnageOf(performed)).toBe(260);
  });

  it('additionne les séries', () => {
    const performed: Record<string, PerformedValues> = {
      [KEY]: {
        sets: [
          { weight: 26, reps: 10 },
          { weight: 24, reps: 8 },
        ],
      },
    };
    expect(tonnageOf(performed)).toBe(452);
  });

  it('ignore une série sans charge', () => {
    const performed: Record<string, PerformedValues> = {
      [KEY]: { sets: [{ reps: 10 }, { weight: 26, reps: 10 }] },
    };
    expect(tonnageOf(performed)).toBe(260);
  });

  it('ignore une charge sans répétitions, faute de savoir combien de fois', () => {
    const performed: Record<string, PerformedValues> = {
      [KEY]: { sets: [{ weight: 26 }] },
    };
    expect(tonnageOf(performed)).toBe(0);
  });

  it('se rabat sur la dose prescrite pour une série cochée', () => {
    // C'est le cas du mode guidé : on n'y saisit qu'une charge, cocher disant
    // déjà qu'on a fait ce qui était écrit. Sans ce second cas, le tonnage
    // serait toujours nul là où il est le plus utile.
    const performed: Record<string, PerformedValues> = {
      [KEY]: { sets: [{ weight: 26 }] },
    };
    const prescribed = new Map([[`${KEY}:1`, 12]]);
    expect(tonnageOf(performed, prescribed)).toBe(312);
  });

  it("ne se rabat pas sur une dose non cochée : une série pesée n'est pas une série faite", () => {
    const performed: Record<string, PerformedValues> = {
      [KEY]: { sets: [{ weight: 26 }, { weight: 26 }] },
    };
    // Seule la première est cochée.
    const prescribed = new Map([[`${KEY}:1`, 12]]);
    expect(tonnageOf(performed, prescribed)).toBe(312);
  });

  it('préfère ce que le client a tapé à ce qui était prescrit', () => {
    const performed: Record<string, PerformedValues> = {
      [KEY]: { sets: [{ weight: 26, reps: 8 }] },
    };
    const prescribed = new Map([[`${KEY}:1`, 12]]);
    expect(tonnageOf(performed, prescribed)).toBe(208);
  });

  it('vaut zéro quand rien n’a été noté', () => {
    expect(tonnageOf({})).toBe(0);
  });
});

describe('les doses qui peuvent compter', () => {
  it('ne retient que les séries cochées', () => {
    const session = makeSession({
      blocks: [
        makeBlock({
          type: 'classic',
          exercises: [makeBlockExercise({ sets: 3, reps: 10 })],
        }),
      ],
    });
    const keys = [...allowedReps(session, ['1:1:1', '1:1:3']).keys()];
    expect(keys.sort()).toEqual(['1:1:1', '1:1:3']);
  });

  it('prend la dose du palier sur une pyramide', () => {
    const session = makeSession({
      blocks: [
        makeBlock({
          type: 'ladder',
          repsScheme: [21, 15, 9],
          exercises: [makeBlockExercise({})],
        }),
      ],
    });
    const allowed = allowedReps(session, ['1:1:1', '1:1:2', '1:1:3']);
    expect([...allowed.values()]).toEqual([21, 15, 9]);
  });

  it('ne retient rien quand le coach n’a prescrit aucune répétition', () => {
    const session = makeSession({
      blocks: [
        makeBlock({
          type: 'classic',
          exercises: [makeBlockExercise({ sets: 2 })],
        }),
      ],
    });
    expect(allowedReps(session, ['1:1:1', '1:1:2']).size).toBe(0);
  });

  it('ne retient rien sur un historique de cases vide', () => {
    const session = makeSession({
      blocks: [
        makeBlock({
          type: 'classic',
          exercises: [makeBlockExercise({ sets: 3, reps: 10 })],
        }),
      ],
    });
    expect(allowedReps(session, []).size).toBe(0);
  });
});

describe('ce qui a été fait, et ce qu’il y avait à faire', () => {
  it('compte les séries d’un bloc en liste', () => {
    const session = makeSession({
      blocks: [
        makeBlock({
          type: 'classic',
          exercises: [makeBlockExercise({ sets: 4, reps: 10 })],
        }),
      ],
    });
    const steps = buildGuidedSteps(session);
    expect(countSets(steps, 0, [])).toEqual({ total: 4, done: 0 });
    expect(countSets(steps, 0, ['1:1:1', '1:1:2'])).toEqual({
      total: 4,
      done: 2,
    });
  });

  it('compte un tour dès qu’on l’a dépassé : il ne se coche pas', () => {
    // Sans cela, quelqu'un qui vient de faire tout un Tabata lirait « 0 sur
    // 8 » — un constat qui accuse.
    const session = makeSession({
      blocks: [
        makeBlock({
          type: 'tabata',
          rounds: 8,
          workDuration: 20,
          restDuration: 10,
        }),
      ],
    });
    const steps = buildGuidedSteps(session);
    expect(countSets(steps, 0, [])).toEqual({ total: 8, done: 0 });
    expect(countSets(steps, 5, [])).toEqual({ total: 8, done: 5 });
    expect(countSets(steps, 8, [])).toEqual({ total: 8, done: 8 });
  });

  it('compte les deux ensemble quand la séance mêle les formats', () => {
    const session = makeSession({
      blocks: [
        makeBlock({
          order: 1,
          type: 'tabata',
          rounds: 4,
          workDuration: 20,
          restDuration: 10,
        }),
        makeBlock({
          order: 2,
          type: 'classic',
          exercises: [makeBlockExercise({ sets: 3, reps: 10 })],
        }),
      ],
    });
    const steps = buildGuidedSteps(session);
    expect(countSets(steps, 4, ['2:1:1'])).toEqual({ total: 7, done: 5 });
  });

  it('ne compte pas une boucle : son unité est le tour bouclé', () => {
    const session = makeSession({
      blocks: [makeBlock({ type: 'amrap', durationMinutes: 12 })],
    });
    expect(countSets(buildGuidedSteps(session), 1, [])).toEqual({
      total: 0,
      done: 0,
    });
  });

  it('ne dépasse jamais le total', () => {
    const session = makeSession({
      blocks: [
        makeBlock({
          type: 'classic',
          exercises: [makeBlockExercise({ sets: 2, reps: 10 })],
        }),
      ],
    });
    const steps = buildGuidedSteps(session);
    expect(countSets(steps, 9, ['1:1:1', '1:1:2', 'une-clé-périmée'])).toEqual({
      total: 2,
      done: 2,
    });
  });
});

describe('le constat entier', () => {
  const session = makeSession({
    blocks: [
      makeBlock({
        type: 'classic',
        exercises: [makeBlockExercise({ sets: 2, reps: 10 })],
      }),
    ],
  });
  const steps = buildGuidedSteps(session);

  it('rassemble les chiffres', () => {
    const recap = buildRecap({
      session,
      steps,
      step: 0,
      performed: { [KEY]: { sets: [{ weight: 26 }, { weight: 26 }] } },
      done: ['1:1:1', '1:1:2'],
      rounds: { '3': 7 },
      startedAt: 1_000_000,
      now: 1_000_000 + 42 * 60_000,
    });
    expect(recap).toEqual({
      durationMinutes: 42,
      setsDone: 2,
      setsTotal: 2,
      tonnage: 520,
      rounds: 7,
    });
  });

  it('additionne les tours de tous les blocs qui s’en comptent', () => {
    const recap = buildRecap({
      session,
      steps,
      step: 0,
      performed: {},
      done: [],
      rounds: { '2': 5, '3': 7 },
    });
    expect(recap.rounds).toBe(12);
  });

  it('ne dit aucune durée sans heure de départ', () => {
    const recap = buildRecap({
      session,
      steps,
      step: 0,
      performed: {},
      done: [],
      rounds: {},
    });
    expect(recap.durationMinutes).toBeUndefined();
  });

  it('ne dit aucune durée au-delà de six heures', () => {
    // Une séance ouverte hier et terminée aujourd'hui donnerait un nombre
    // absurde : mieux vaut se taire.
    const recap = buildRecap({
      session,
      steps,
      step: 0,
      performed: {},
      done: [],
      rounds: {},
      startedAt: 1_000_000,
      now: 1_000_000 + 7 * 3600_000,
    });
    expect(recap.durationMinutes).toBeUndefined();
  });

  it('arrondit à la minute, et jamais à zéro', () => {
    const recap = buildRecap({
      session,
      steps,
      step: 0,
      performed: {},
      done: [],
      rounds: {},
      startedAt: 1_000_000,
      now: 1_000_000 + 20_000,
    });
    expect(recap.durationMinutes).toBe(1);
  });
});

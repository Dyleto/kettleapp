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
import {
  allowedReps,
  buildRecap,
  comparisonsOf,
  countSets,
  tonnageOf,
} from './recap';
import { buildGuidedSteps } from './guidedSteps';
import { performedKey } from './lastPerformance';
import { bloc, exercice, pose, seance } from './fixtures';
import type { PerformedValues } from '@/shared/types';
import type { LastPerformance } from './lastPerformance';

const CLE = performedKey(1, 1);

describe('le tonnage', () => {
  it('multiplie la charge par les répétitions tapées', () => {
    const performed: Record<string, PerformedValues> = {
      [CLE]: { sets: [{ weight: 26, reps: 10 }] },
    };
    expect(tonnageOf(performed)).toBe(260);
  });

  it('additionne les séries', () => {
    const performed: Record<string, PerformedValues> = {
      [CLE]: {
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
      [CLE]: { sets: [{ reps: 10 }, { weight: 26, reps: 10 }] },
    };
    expect(tonnageOf(performed)).toBe(260);
  });

  it('ignore une charge sans répétitions, faute de savoir combien de fois', () => {
    const performed: Record<string, PerformedValues> = {
      [CLE]: { sets: [{ weight: 26 }] },
    };
    expect(tonnageOf(performed)).toBe(0);
  });

  it('se rabat sur la dose prescrite pour une série cochée', () => {
    // C'est le cas du mode guidé : on n'y saisit qu'une charge, cocher disant
    // déjà qu'on a fait ce qui était écrit. Sans ce second cas, le tonnage
    // serait toujours nul là où il est le plus utile.
    const performed: Record<string, PerformedValues> = {
      [CLE]: { sets: [{ weight: 26 }] },
    };
    const prescrites = new Map([[`${CLE}:1`, 12]]);
    expect(tonnageOf(performed, prescrites)).toBe(312);
  });

  it("ne se rabat pas sur une dose non cochée : une série pesée n'est pas une série faite", () => {
    const performed: Record<string, PerformedValues> = {
      [CLE]: { sets: [{ weight: 26 }, { weight: 26 }] },
    };
    // Seule la première est cochée.
    const prescrites = new Map([[`${CLE}:1`, 12]]);
    expect(tonnageOf(performed, prescrites)).toBe(312);
  });

  it('préfère ce que le client a tapé à ce qui était prescrit', () => {
    const performed: Record<string, PerformedValues> = {
      [CLE]: { sets: [{ weight: 26, reps: 8 }] },
    };
    const prescrites = new Map([[`${CLE}:1`, 12]]);
    expect(tonnageOf(performed, prescrites)).toBe(208);
  });

  it('vaut zéro quand rien n’a été noté', () => {
    expect(tonnageOf({})).toBe(0);
  });
});

describe('les doses qui peuvent compter', () => {
  it('ne retient que les séries cochées', () => {
    const session = seance({
      blocks: [
        bloc({ type: 'classic', exercises: [pose({ sets: 3, reps: 10 })] }),
      ],
    });
    const cles = [...allowedReps(session, ['1:1:1', '1:1:3']).keys()];
    expect(cles.sort()).toEqual(['1:1:1', '1:1:3']);
  });

  it('prend la dose du palier sur une pyramide', () => {
    const session = seance({
      blocks: [
        bloc({
          type: 'pyramid',
          repsScheme: [21, 15, 9],
          exercises: [pose({})],
        }),
      ],
    });
    const permises = allowedReps(session, ['1:1:1', '1:1:2', '1:1:3']);
    expect([...permises.values()]).toEqual([21, 15, 9]);
  });

  it('ne retient rien quand le coach n’a prescrit aucune répétition', () => {
    const session = seance({
      blocks: [bloc({ type: 'classic', exercises: [pose({ sets: 2 })] })],
    });
    expect(allowedReps(session, ['1:1:1', '1:1:2']).size).toBe(0);
  });

  it('ne retient rien sur un historique de cases vide', () => {
    const session = seance({
      blocks: [
        bloc({ type: 'classic', exercises: [pose({ sets: 3, reps: 10 })] }),
      ],
    });
    expect(allowedReps(session, []).size).toBe(0);
  });
});

describe('ce qui a été fait, et ce qu’il y avait à faire', () => {
  it('compte les séries d’un bloc en liste', () => {
    const session = seance({
      blocks: [
        bloc({ type: 'classic', exercises: [pose({ sets: 4, reps: 10 })] }),
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
    const session = seance({
      blocks: [
        bloc({ type: 'tabata', rounds: 8, workDuration: 20, restDuration: 10 }),
      ],
    });
    const steps = buildGuidedSteps(session);
    expect(countSets(steps, 0, [])).toEqual({ total: 8, done: 0 });
    expect(countSets(steps, 5, [])).toEqual({ total: 8, done: 5 });
    expect(countSets(steps, 8, [])).toEqual({ total: 8, done: 8 });
  });

  it('compte les deux ensemble quand la séance mêle les formats', () => {
    const session = seance({
      blocks: [
        bloc({
          order: 1,
          type: 'tabata',
          rounds: 4,
          workDuration: 20,
          restDuration: 10,
        }),
        bloc({
          order: 2,
          type: 'classic',
          exercises: [pose({ sets: 3, reps: 10 })],
        }),
      ],
    });
    const steps = buildGuidedSteps(session);
    expect(countSets(steps, 4, ['2:1:1'])).toEqual({ total: 7, done: 5 });
  });

  it('ne compte pas une boucle : son unité est le tour bouclé', () => {
    const session = seance({
      blocks: [bloc({ type: 'amrap', durationMinutes: 12 })],
    });
    expect(countSets(buildGuidedSteps(session), 1, [])).toEqual({
      total: 0,
      done: 0,
    });
  });

  it('ne dépasse jamais le total', () => {
    const session = seance({
      blocks: [
        bloc({ type: 'classic', exercises: [pose({ sets: 2, reps: 10 })] }),
      ],
    });
    const steps = buildGuidedSteps(session);
    expect(countSets(steps, 9, ['1:1:1', '1:1:2', 'une-clé-périmée'])).toEqual({
      total: 2,
      done: 2,
    });
  });
});

describe('ce qui a bougé depuis la dernière fois', () => {
  const avecCharge = (charge: number) => ({
    [performedKey(1, 1)]: { sets: [{ weight: charge, reps: 10 }] },
  });

  it('dit la charge du jour, et l’écart', () => {
    const session = seance({ blocks: [bloc({ exercises: [pose({})] })] });
    const avant: Map<string, LastPerformance> = new Map([
      ['ex-goblet', { sets: [{ weight: 24 }], completedAt: new Date() }],
    ]);
    expect(comparisonsOf(session, avecCharge(26), avant)).toEqual([
      { name: 'Goblet Squat', load: 26, delta: 2 },
    ]);
  });

  it('n’invente aucun écart sans dernière fois', () => {
    const session = seance({ blocks: [bloc({ exercises: [pose({})] })] });
    expect(comparisonsOf(session, avecCharge(26))).toEqual([
      { name: 'Goblet Squat', load: 26, delta: undefined },
    ]);
  });

  it('garde un écart nul : « j’ai tenu ma charge » est une information', () => {
    const session = seance({ blocks: [bloc({ exercises: [pose({})] })] });
    const avant: Map<string, LastPerformance> = new Map([
      ['ex-goblet', { sets: [{ weight: 26 }], completedAt: new Date() }],
    ]);
    expect(comparisonsOf(session, avecCharge(26))[0].load).toBe(26);
    expect(comparisonsOf(session, avecCharge(26), avant)[0].delta).toBe(0);
  });

  it('écarte un mouvement sans charge notée', () => {
    const session = seance({ blocks: [bloc({ exercises: [pose({})] })] });
    expect(comparisonsOf(session, {})).toEqual([]);
  });

  it('retient la charge la plus lourde du jour', () => {
    const session = seance({ blocks: [bloc({ exercises: [pose({})] })] });
    const performed = {
      [performedKey(1, 1)]: {
        sets: [
          { weight: 24, reps: 10 },
          { weight: 28, reps: 6 },
          { weight: 26 },
        ],
      },
    };
    expect(comparisonsOf(session, performed)[0].load).toBe(28);
  });

  it('met devant le plus grand écart, et n’en garde que trois', () => {
    const quatre = [
      pose({ order: 1, exercise: exercice({ _id: 'a', name: 'A' }) }),
      pose({ order: 2, exercise: exercice({ _id: 'b', name: 'B' }) }),
      pose({ order: 3, exercise: exercice({ _id: 'c', name: 'C' }) }),
      pose({ order: 4, exercise: exercice({ _id: 'd', name: 'D' }) }),
    ];
    const session = seance({ blocks: [bloc({ exercises: quatre })] });
    const performed = Object.fromEntries(
      [26, 30, 40, 28].map((charge, i) => [
        performedKey(1, i + 1),
        { sets: [{ weight: charge, reps: 10 }] },
      ])
    );
    const avant: Map<string, LastPerformance> = new Map(
      ['a', 'b', 'c', 'd'].map((id) => [
        id,
        { sets: [{ weight: 26 }], completedAt: new Date() },
      ])
    );
    const lignes = comparisonsOf(session, performed, avant);
    expect(lignes.map((l) => l.name)).toEqual(['C', 'B', 'D']);
    expect(lignes).toHaveLength(3);
  });
});

describe('le constat entier', () => {
  const session = seance({
    blocks: [
      bloc({ type: 'classic', exercises: [pose({ sets: 2, reps: 10 })] }),
    ],
  });
  const steps = buildGuidedSteps(session);

  it('rassemble les cinq chiffres', () => {
    const recap = buildRecap({
      session,
      steps,
      step: 0,
      performed: { [CLE]: { sets: [{ weight: 26 }, { weight: 26 }] } },
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
      comparisons: [{ name: 'Goblet Squat', load: 26, delta: undefined }],
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

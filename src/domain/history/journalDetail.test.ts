/**
 * Le détail d'une séance faite : le prévu en face du fait, la flèche du
 * passage d'avant, le score d'un bloc, et ce que le programme est devenu.
 */
import { describe, expect, it } from 'vitest';
import {
  freeze,
  makeBlock,
  makeBlockExercise,
  makeBlockSnapshot,
  makeCompleted,
  makeExercise,
  makeExerciseSnapshot,
  makeSession,
} from '@/domain/fixtures';
import {
  detailDate,
  doneLines,
  plannedDose,
  previousPassage,
  sinceThen,
} from './journalDetail';

const SWING = { _id: 'ex-swing', name: 'Kettlebell Swing' };
const GOBLET = { _id: 'ex-goblet', name: 'Goblet Squat' };

describe('le prévu', () => {
  it('des séries de répétitions : « 4 × 12 reps »', () => {
    const block = makeBlockSnapshot();
    expect(
      plannedDose(block, makeExerciseSnapshot({ sets: 4, reps: 12 }))
    ).toBe('4 × 12 reps');
  });

  it('une durée, une mesure libre', () => {
    const block = makeBlockSnapshot();
    expect(plannedDose(block, makeExerciseSnapshot({ duration: 45 }))).toBe(
      '45 s'
    );
    expect(
      plannedDose(
        block,
        makeExerciseSnapshot({ customMetric: { value: 500, unit: 'm' } })
      )
    ).toBe('500 m');
  });

  // Hors d'un bloc à séries, le compte de séries ne veut rien dire.
  it('dans un EMOM, pas de séries : « 15 reps »', () => {
    const block = makeBlockSnapshot({ type: 'emom' });
    expect(
      plannedDose(block, makeExerciseSnapshot({ sets: 3, reps: 15 }))
    ).toBe('15 reps');
  });

  it('une échelle porte sa mesure sur le bloc : rien sur l’exercice', () => {
    const block = makeBlockSnapshot({ type: 'ladder', repsScheme: [5, 10] });
    expect(plannedDose(block, makeExerciseSnapshot({ reps: 10 }))).toBeNull();
  });

  it('rien de prescrit : rien', () => {
    expect(plannedDose(makeBlockSnapshot(), makeExerciseSnapshot())).toBeNull();
  });
});

describe('le passage d’avant', () => {
  const at = (day: string, id: string, sessionId = 'seance-1') =>
    makeCompleted({
      _id: id,
      originalSessionId: sessionId,
      completedAt: `2026-08-${day}T18:00:00.000Z`,
    });
  const history = [
    at('30', 'c30'),
    at('26', 'c26'),
    at('28', 'autre', 'seance-2'),
    at('22', 'c22'),
  ];

  it('la même séance, juste avant', () => {
    expect(previousPassage(history[0], history)?._id).toBe('c26');
  });

  it('la première fois : aucun', () => {
    expect(previousPassage(history[3], history)).toBeUndefined();
  });
});

describe('ce qui a été fait', () => {
  const passage = (
    goblet: { weight?: number; reps?: number }[],
    extra: Parameters<typeof makeExerciseSnapshot>[0] = {}
  ) =>
    makeCompleted({
      blocks: [
        makeBlockSnapshot({
          exercises: [
            makeExerciseSnapshot({
              exercise: GOBLET,
              sets: 1,
              reps: 12,
              performed: { sets: goblet },
              ...extra,
            }),
            makeExerciseSnapshot({ exercise: SWING, order: 2, reps: 15 }),
          ],
        }),
      ],
    });

  it('le prévu à gauche, le fait à droite, écrit comme partout', () => {
    const [goblet] = doneLines(passage([{ weight: 26, reps: 12 }]), undefined);
    expect(goblet).toMatchObject({
      name: 'Goblet Squat',
      planned: 'prévu 12 reps',
      done: '12 reps · 26 kg',
      up: false,
    });
  });

  it('la charge passe celle d’avant : la flèche', () => {
    const before = passage([{ weight: 24, reps: 12 }]);
    const [goblet] = doneLines(passage([{ weight: 26, reps: 12 }]), before);
    expect(goblet.up).toBe(true);
  });

  it('la même charge, ou moins : pas de flèche', () => {
    const before = passage([{ weight: 26, reps: 12 }]);
    expect(doneLines(passage([{ weight: 26, reps: 12 }]), before)[0].up).toBe(
      false
    );
    expect(doneLines(passage([{ weight: 24, reps: 12 }]), before)[0].up).toBe(
      false
    );
  });

  it('rien de noté : « fait, sans charge notée », en retrait', () => {
    const [, swing] = doneLines(passage([]), undefined);
    expect(swing).toMatchObject({
      name: 'Kettlebell Swing',
      planned: 'prévu 15 reps',
      done: 'fait, sans charge notée',
      noted: false,
    });
  });

  // Un Tabata sans répétitions se fait au temps du bloc.
  it('dans un Tabata au temps, rien de noté : « fait » seul', () => {
    const tabata = makeCompleted({
      blocks: [
        makeBlockSnapshot({
          type: 'tabata',
          workDuration: 20,
          exercises: [makeExerciseSnapshot({ exercise: SWING })],
        }),
      ],
    });
    expect(doneLines(tabata, undefined)[0].done).toBe('fait');
  });

  // Une corde à sauter n'a jamais eu de charge à noter.
  it('au temps, rien de noté : « fait » seul', () => {
    const timed = makeCompleted({
      blocks: [
        makeBlockSnapshot({
          exercises: [makeExerciseSnapshot({ exercise: SWING, duration: 120 })],
        }),
      ],
    });
    expect(doneLines(timed, undefined)[0]).toMatchObject({
      planned: 'prévu 2 min',
      done: 'fait',
      noted: false,
    });
  });

  // Six « fait, sans charge notée » sous un AMRAP noieraient son score.
  it('un bloc qui se compte : son score, et ses seuls mouvements chargés', () => {
    const amrap = makeCompleted({
      blocks: [
        makeBlockSnapshot({
          type: 'amrap',
          durationMinutes: 12,
          performedRounds: 5,
          exercises: [
            makeExerciseSnapshot({ exercise: SWING, reps: 15 }),
            makeExerciseSnapshot({
              exercise: GOBLET,
              order: 2,
              reps: 10,
              performed: { sets: [{ weight: 20 }] },
            }),
          ],
        }),
      ],
    });
    expect(
      doneLines(amrap, undefined).map(({ name, done }) => [name, done])
    ).toEqual([
      ['Goblet Squat', '20 kg'],
      ['AMRAP 12 min', '5 tours'],
    ]);
  });

  it('un exercice dont l’instantané a perdu sa forme garde une ligne', () => {
    const odd = makeCompleted({
      blocks: [
        makeBlockSnapshot({
          exercises: [makeExerciseSnapshot({ exercise: {}, reps: 8 })],
        }),
      ],
    });
    expect(doneLines(odd, undefined)[0].name).toBe('Exercice');
  });
});

describe('depuis', () => {
  const session = makeSession({
    blocks: [
      makeBlock({
        exercises: [
          makeBlockExercise({ exercise: makeExercise(), sets: 3, reps: 12 }),
        ],
      }),
    ],
  });
  const done = makeCompleted({
    originalSessionId: session._id,
    blocks: session.blocks.map(freeze),
  });

  it('la séance n’a pas bougé', () => {
    expect(sinceThen(done, [session])).toMatchObject({ state: 'same' });
  });

  // Le « prévu » affiché est celui du jour où elle a été faite.
  it('le travail a changé : le dire', () => {
    const reworked = makeSession({
      blocks: [
        makeBlock({
          exercises: [
            makeBlockExercise({ exercise: makeExercise(), sets: 4, reps: 10 }),
          ],
        }),
      ],
    });
    expect(sinceThen(done, [reworked])).toMatchObject({ state: 'changed' });
  });

  it('renommée seulement : rien n’a changé', () => {
    expect(
      sinceThen(done, [{ ...session, name: 'Full body B' }])
    ).toMatchObject({ state: 'same' });
  });

  it('retirée du programme : partie', () => {
    expect(sinceThen(done, [])).toEqual({ state: 'gone' });
  });
});

describe('la date du détail', () => {
  const now = new Date('2026-11-20T10:00:00.000Z');
  it('en toutes lettres, une capitale devant', () => {
    expect(detailDate('2026-08-30T18:00:00.000Z', now)).toBe(
      'Dimanche 30 août'
    );
  });

  it('une autre année se date avec elle', () => {
    expect(detailDate('2025-08-30T18:00:00.000Z', now)).toBe(
      'Samedi 30 août 2025'
    );
  });
});

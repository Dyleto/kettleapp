/**
 * Corriger une séance déjà envoyée : la séance de ce jour-là, ses charges,
 * et ce qui a changé.
 */
import { describe, expect, it } from 'vitest';
import {
  makeBlockSnapshot,
  makeCompleted,
  makeExerciseSnapshot,
} from '@/domain/fixtures';
import {
  changedPerformed,
  recordedPerformed,
  snapshotSession,
} from './correction';

const completed = makeCompleted({
  originalSessionId: 'seance-1',
  sessionOrder: 2,
  sessionName: 'Haut du corps',
  blocks: [
    makeBlockSnapshot({
      type: 'classic',
      order: 1,
      exercises: [
        makeExerciseSnapshot({
          order: 1,
          sets: 3,
          reps: 12,
          performed: { sets: [{ weight: 24, reps: 12 }] },
        }),
        makeExerciseSnapshot({
          exercise: { _id: 'ex-swing', name: 'Kettlebell Swing' },
          order: 2,
          reps: 15,
        }),
      ],
    }),
  ],
});

describe('la séance de ce jour-là', () => {
  it('reprend l’instantané : nom, rang, blocs, doses', () => {
    const session = snapshotSession(completed);
    expect(session).toMatchObject({
      _id: 'seance-1',
      order: 2,
      name: 'Haut du corps',
    });
    expect(session.blocks[0]).toMatchObject({
      _id: 'snap-0',
      type: 'classic',
      exercises: [
        { order: 1, sets: 3, reps: 12 },
        { order: 2, reps: 15 },
      ],
    });
  });
});

describe('les charges notées', () => {
  it('par mouvement, et seulement ceux qui en ont', () => {
    expect(recordedPerformed(completed)).toEqual({
      '1:1': { sets: [{ weight: 24, reps: 12 }] },
    });
  });

  // Les modifier ne doit pas toucher au bilan en cache.
  it('copiées, pas partagées', () => {
    const copy = recordedPerformed(completed);
    copy['1:1'].sets[0].weight = 99;
    expect(completed.blocks[0].exercises[0].performed?.sets[0].weight).toBe(24);
  });
});

describe('ce qui a changé', () => {
  const original = recordedPerformed(completed);

  it('rien touché : rien à renvoyer', () => {
    expect(changedPerformed(original, recordedPerformed(completed))).toEqual(
      []
    );
  });

  it('une charge corrigée : ce mouvement, ses séries entières', () => {
    const edited = {
      ...original,
      '1:1': { sets: [{ weight: 26, reps: 12 }] },
    };
    expect(changedPerformed(original, edited)).toEqual([
      { blockOrder: 1, exerciseOrder: 1, sets: [{ weight: 26, reps: 12 }] },
    ]);
  });

  it('un mouvement noté après coup', () => {
    const edited = { ...original, '1:2': { sets: [{ weight: 16 }] } };
    expect(changedPerformed(original, edited)).toEqual([
      { blockOrder: 1, exerciseOrder: 2, sets: [{ weight: 16 }] },
    ]);
  });

  // Une liste vide efface ce qui était noté.
  it('des séries effacées partent vides', () => {
    expect(changedPerformed(original, { '1:1': { sets: [] } })).toEqual([
      { blockOrder: 1, exerciseOrder: 1, sets: [] },
    ]);
  });

  // Comme à l'envoi : une série vide arrête la liste.
  it('une série vide en queue ne change rien', () => {
    const edited = { '1:1': { sets: [{ weight: 24, reps: 12 }, {}] } };
    expect(changedPerformed(original, edited)).toEqual([]);
  });
});

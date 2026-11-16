/**
 * Le record du jour.
 *
 * Il se mesure au meilleur de tout l'historique, pas à la dernière fois :
 * battre une séance où l'on avait levé léger n'est pas un record. Et un
 * mouvement fait pour la première fois n'en fait pas : il n'a pas de
 * meilleur précédent.
 */
import { describe, expect, it } from 'vitest';
import { bestLoads, highlightOf } from './records';
import { performedKey } from '@/domain/history/lastPerformance';
import {
  makeBlock,
  makeBlockSnapshot,
  makeCompleted,
  makeExercise,
  makeExerciseSnapshot,
  makeBlockExercise,
  makeSession,
} from '@/domain/fixtures';
import type { LastPerformance } from '@/domain/history/lastPerformance';

describe('le record, et ce qui est vrai à sa place', () => {
  /** Un bilan où le Goblet Squat a été fait à ces charges. */
  const pastWith = (id: string, ...weights: number[]) =>
    makeCompleted({
      _id: id,
      blocks: [
        makeBlockSnapshot({
          exercises: [
            makeExerciseSnapshot({
              performed: { sets: weights.map((weight) => ({ weight })) },
            }),
          ],
        }),
      ],
    });
  const session = makeSession({
    blocks: [makeBlock({ exercises: [makeBlockExercise({})] })],
  });
  const today = (load: number) => ({
    [performedKey(1, 1)]: { sets: [{ weight: load, reps: 10 }] },
  });

  it('retient le meilleur de tout l’historique, pas la dernière fois', () => {
    expect(
      bestLoads([pastWith('a', 22, 28), pastWith('b', 24)]).get('ex-goblet')
    ).toBe(28);
  });

  it('un record se mesure à ce meilleur', () => {
    // 26 bat la dernière fois (24), pas le meilleur (28) : ce n'est pas un
    // record.
    const history = [pastWith('a', 28), pastWith('b', 24)];
    expect(highlightOf(session, today(26), history)).toBeNull();
    expect(highlightOf(session, today(30), history)).toEqual({
      kind: 'record',
      name: 'Goblet Squat',
      load: 30,
      gain: 2,
      others: 0,
    });
  });

  it('n’invente pas de record pour un mouvement fait la première fois', () => {
    expect(highlightOf(session, today(40), [])).toBeNull();
  });

  it('affiche le plus grand écart, et compte les autres', () => {
    const swing = makeExercise({ _id: 'ex-swing', name: 'Kettlebell Swing' });
    const two = makeSession({
      blocks: [
        makeBlock({
          exercises: [
            makeBlockExercise({ order: 1 }),
            makeBlockExercise({ order: 2, exercise: swing }),
          ],
        }),
      ],
    });
    const history = [
      makeCompleted({
        blocks: [
          makeBlockSnapshot({
            exercises: [
              makeExerciseSnapshot({ performed: { sets: [{ weight: 26 }] } }),
              makeExerciseSnapshot({
                order: 2,
                exercise: { _id: 'ex-swing', name: 'Kettlebell Swing' },
                performed: { sets: [{ weight: 16 }] },
              }),
            ],
          }),
        ],
      }),
    ];
    const performed = {
      [performedKey(1, 1)]: { sets: [{ weight: 28 }] },
      [performedKey(1, 2)]: { sets: [{ weight: 20 }] },
    };
    expect(highlightOf(two, performed, history)).toEqual({
      kind: 'record',
      name: 'Kettlebell Swing',
      load: 20,
      gain: 4,
      others: 1,
    });
  });

  it('dit la régularité quand une charge est tenue', () => {
    const last: Map<string, LastPerformance> = new Map([
      ['ex-goblet', { sets: [{ weight: 26 }], completedAt: new Date() }],
    ]);
    expect(highlightOf(session, today(26), [pastWith('a', 28)], last)).toEqual({
      kind: 'steady',
    });
  });
});

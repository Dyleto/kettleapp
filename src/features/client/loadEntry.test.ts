import { describe, expect, it } from 'vitest';
import { firstOpen, loadRows, sameWeightForAll, withWeight } from './loadEntry';
import {
  makeBlock,
  makeBlockExercise,
  makeExercise,
  makeSession,
} from '@/domain/fixtures';

describe('loadRows', () => {
  const session = makeSession({
    blocks: [
      makeBlock({
        order: 2,
        type: 'classic',
        exercises: [makeBlockExercise({ sets: 4, reps: 10 })],
      }),
      makeBlock({
        _id: 'b-tabata',
        order: 1,
        type: 'tabata',
        rounds: 8,
        workDuration: 20,
        restDuration: 10,
        exercises: [
          makeBlockExercise({
            exercise: makeExercise({ _id: 'ex-push', name: 'Pompes' }),
          }),
        ],
      }),
    ],
  });

  it('suit l’ordre des blocs, et dit la prescription à droite du nom', () => {
    expect(
      loadRows(session).map((row) => [row.key, row.name, row.summary])
    ).toEqual([
      ['1:1', 'Pompes', 'Tabata · 8 tours · 4 min'],
      ['2:1', 'Goblet Squat', '4 × 10'],
    ]);
  });

  it('écrit les répétitions d’une série unique en clair', () => {
    const single = makeSession({
      blocks: [
        makeBlock({
          type: 'warmup',
          exercises: [makeBlockExercise({ sets: 1, reps: 15 })],
        }),
      ],
    });
    expect(loadRows(single)[0].summary).toBe('15\u00A0reps');
  });

  it('une série à noter par série prescrite, une seule sur un bloc minuté', () => {
    expect(loadRows(session).map((row) => row.labels.length)).toEqual([1, 4]);
  });
});

describe('firstOpen', () => {
  it('ouvre la première série vide, et seulement elle', () => {
    expect(firstOpen([{ weight: 26 }, { weight: 26 }], 4)).toBe(2);
    expect(firstOpen([], 4)).toBe(0);
    expect(firstOpen([{ weight: 26 }, {}, { weight: 28 }], 4)).toBe(1);
  });

  it('ne dépasse pas le nombre de séries', () => {
    expect(firstOpen([{ weight: 1 }, { weight: 1 }], 2)).toBe(2);
  });
});

describe('withWeight', () => {
  it('pose une charge sur une série, répétitions gardées', () => {
    expect(withWeight([{ weight: 20, reps: 8 }], 0, 22)).toEqual([
      { weight: 22, reps: 8 },
    ]);
  });

  it('ajoute la série suivante', () => {
    expect(withWeight([{ weight: 20 }], 1, 20)).toEqual([
      { weight: 20 },
      { weight: 20 },
    ]);
  });

  it('vider une série sans rien d’autre la retire, avec les suivantes', () => {
    expect(
      withWeight([{ weight: 20 }, { weight: 20 }, { weight: 22 }], 1, undefined)
    ).toEqual([{ weight: 20 }]);
  });
});

describe('sameWeightForAll', () => {
  it('recopie la première charge sur toutes les séries', () => {
    expect(
      sameWeightForAll([{ weight: 26, reps: 10 }, { weight: 28 }], 3)
    ).toEqual([{ weight: 26, reps: 10 }, { weight: 26 }, { weight: 26 }]);
  });

  it('ne fait rien sans première charge', () => {
    expect(sameWeightForAll([], 3)).toEqual([]);
  });
});

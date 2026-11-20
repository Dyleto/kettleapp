/**
 * Les mouvements et les records de l'écran Progrès.
 */
import { describe, expect, it } from 'vitest';
import type { PerformedSet } from '@/shared/types';
import {
  makeBlockSnapshot,
  makeCompleted,
  makeExerciseSnapshot,
} from '@/domain/fixtures';
import {
  deltaLabel,
  loadLabel,
  movementsOf,
  passageDate,
  recordCards,
} from './movements';

const SWING = { _id: 'ex-swing', name: 'Kettlebell Swing' };
const GOBLET = { _id: 'ex-goblet', name: 'Goblet Squat' };
const LUNGE = { _id: 'ex-lunge', name: 'Fentes marchées' };

/** Une séance faite le `day` d'août, avec une série par mouvement. */
const done = (
  day: string,
  loads: [typeof SWING, PerformedSet[]][],
  extra: Parameters<typeof makeCompleted>[0] = {}
) =>
  makeCompleted({
    _id: `bilan-${day}`,
    completedAt: `2026-08-${day}T18:00:00.000Z`,
    blocks: [
      makeBlockSnapshot({
        type: 'emom',
        exercises: loads.map(([exercise, sets], i) =>
          makeExerciseSnapshot({ exercise, order: i + 1, performed: { sets } })
        ),
      }),
    ],
    ...extra,
  });

const HISTORY = [
  done('30', [
    [SWING, [{ weight: 20, reps: 15 }]],
    [GOBLET, [{ weight: 26, reps: 12 }]],
    [LUNGE, [{ weight: 12, reps: 20 }]],
  ]),
  done('22', [
    [SWING, [{ weight: 16, reps: 15 }]],
    [GOBLET, [{ weight: 20, reps: 12 }]],
  ]),
  done('26', [
    [SWING, [{ weight: 20, reps: 15 }]],
    [GOBLET, [{ weight: 24, reps: 12 }]],
  ]),
  done('19', [[LUNGE, [{ weight: 16 }, { weight: 16 }]]]),
];

describe('les mouvements', () => {
  it('le plus récemment travaillé d’abord, dans l’ordre de la séance', () => {
    expect(movementsOf(HISTORY).map((m) => m.name)).toEqual([
      'Kettlebell Swing',
      'Goblet Squat',
      'Fentes marchées',
    ]);
  });

  it('une charge par passage, la plus lourde, du plus ancien au plus récent', () => {
    const goblet = movementsOf(HISTORY).find((m) => m.name === 'Goblet Squat')!;
    expect(goblet.passages.map((p) => p.load)).toEqual([20, 24, 26]);
    expect(goblet.passages[0].format).toBe('EMOM');
  });

  it('l’écart va du premier passage au dernier', () => {
    const [swing, goblet, lunge] = movementsOf(HISTORY);
    expect([swing.delta, goblet.delta, lunge.delta]).toEqual([4, 6, -4]);
  });

  // Refaire 20 kg ne rend pas le record plus neuf.
  it('le record est au premier passage qui l’atteint', () => {
    const [swing] = movementsOf(HISTORY);
    expect(swing.best).toBe(20);
    expect(swing.recordId).toBe('bilan-26');
  });

  it('un mouvement sans charge notée n’en est pas', () => {
    const reps = [done('01', [[SWING, [{ reps: 15 }]]])];
    expect(movementsOf(reps)).toEqual([]);
  });

  it('un instantané sans identifiant est écarté, sans casser le reste', () => {
    const odd = makeCompleted({
      blocks: [
        makeBlockSnapshot({
          exercises: [
            makeExerciseSnapshot({
              exercise: {},
              performed: { sets: [{ weight: 30 }] },
            }),
          ],
        }),
      ],
    });
    expect(movementsOf([odd, ...HISTORY])).toHaveLength(3);
  });
});

describe('les écritures', () => {
  it('« 22,5 kg » : la virgule, jamais arrondi', () => {
    expect(loadLabel(22.5)).toBe('22,5 kg');
  });

  it('« + 6 kg », « − 4 kg » avec un vrai moins, « stable »', () => {
    expect(deltaLabel(6)).toBe('+ 6 kg');
    expect(deltaLabel(-4)).toBe('− 4 kg');
    expect(deltaLabel(2.5)).toBe('+ 2,5 kg');
    expect(deltaLabel(0)).toBe('stable');
  });

  it('« 30 août », et l’année quand ce n’est pas la même', () => {
    const now = new Date('2026-11-20T10:00:00.000Z');
    expect(passageDate('2026-08-30T18:00:00.000Z', now)).toBe('30 août');
    expect(passageDate('2025-08-30T18:00:00.000Z', now)).toBe('30 août 2025');
  });
});

describe('les records', () => {
  it('les deux plus récents, datés au passage qui les a établis', () => {
    expect(recordCards(HISTORY)).toEqual([
      {
        value: '26 kg',
        name: 'Goblet Squat',
        at: '2026-08-30T18:00:00.000Z',
        exerciseId: 'ex-goblet',
      },
      {
        value: '20 kg',
        name: 'Kettlebell Swing',
        at: '2026-08-26T18:00:00.000Z',
        exerciseId: 'ex-swing',
      },
    ]);
  });

  it('le plus de tours bouclés dans un AMRAP en est un', () => {
    const amrap = (day: string, rounds: number) =>
      makeCompleted({
        _id: `amrap-${day}`,
        originalSessionId: 'seance-1',
        completedAt: `2026-09-${day}T18:00:00.000Z`,
        blocks: [
          makeBlockSnapshot({
            type: 'amrap',
            durationMinutes: 12,
            performedRounds: rounds,
          }),
        ],
      });
    const [first] = recordCards([...HISTORY, amrap('02', 5), amrap('05', 4)]);
    expect(first).toEqual({
      value: '5 tours',
      name: 'AMRAP 12 min',
      at: '2026-09-02T18:00:00.000Z',
    });
  });

  it('aucun : rien', () => {
    expect(recordCards([])).toEqual([]);
  });
});

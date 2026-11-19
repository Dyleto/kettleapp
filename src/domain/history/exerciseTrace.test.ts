/**
 * Ce qu'un exercice est devenu chez le client, sous sa ligne dans
 * l'atelier : les charges, le ton, le mot qui le cite.
 */
import { describe, expect, it } from 'vitest';
import type { CompletedSession } from '@/shared/types';
import {
  makeBlock,
  makeBlockExercise,
  makeBlockSnapshot,
  makeCompleted,
  makeExercise,
  makeExerciseSnapshot,
  makeSession,
} from '@/domain/fixtures';
import { exerciseTraces, traceKey } from './exerciseTrace';

const goblet = makeExercise();
const swing = makeExercise({ _id: 'ex-swing', name: 'Kettlebell Swing' });
const session = makeSession({
  blocks: [
    makeBlock({
      exercises: [
        makeBlockExercise({ exercise: swing }),
        makeBlockExercise({ exercise: goblet }),
      ],
    }),
  ],
});

let day = 0;
/** Un passage de la séance 1, un jour après le précédent, avec les charges
 * de chaque mouvement (`null` : noté sans charge). */
const passage = (
  loads: Record<string, number | null>,
  extra: Partial<CompletedSession> = {}
) => {
  day += 1;
  return makeCompleted({
    _id: `bilan-${day}`,
    completedAt: `2026-09-${String(day).padStart(2, '0')}T10:00:00.000Z`,
    blocks: [
      makeBlockSnapshot({
        exercises: Object.entries(loads).map(([id, weight], i) =>
          makeExerciseSnapshot({
            exercise: { _id: id, name: id },
            order: i + 1,
            performed: {
              sets: [weight === null ? { reps: 15 } : { reps: 12, weight }],
            },
          })
        ),
      }),
    ],
    ...extra,
  });
};

const traceAt = (history: CompletedSession[], index: number) =>
  exerciseTraces(session, history).get(traceKey('bloc-1', index));

describe('la trace d’un exercice', () => {
  it('« 20 → 24 → 26 kg » qui monte seule, sur les trois derniers passages', () => {
    const history = [16, 20, 24, 26].map((w) => passage({ 'ex-goblet': w }));
    expect(traceAt(history, 1)).toEqual({
      loads: [20, 24, 26],
      line: '20 → 24 → 26 kg',
      insight: 'Elle monte seule : + 6 kg en trois passages.',
      quote: undefined,
      tone: 'up',
    });
  });

  it('« Fait à 20 kg, trois fois de suite. »', () => {
    const history = [20, 20, 20].map((w) => passage({ 'ex-goblet': w }));
    expect(traceAt(history, 1)?.line).toBe(
      'Fait à 20 kg, trois fois de suite.'
    );
    expect(traceAt(history, 1)?.tone).toBe('plain');
  });

  it('une charge qui baisse inquiète', () => {
    const history = [24, 26, 22].map((w) => passage({ 'ex-goblet': w }));
    const trace = traceAt(history, 1);
    expect(trace?.line).toBe('24 → 26 → 22 kg');
    expect(trace?.insight).toBe(
      'En baisse : − 4 kg depuis le passage d’avant.'
    );
    expect(trace?.tone).toBe('warn');
  });

  it('une seule charge notée : la dernière fois', () => {
    expect(traceAt([passage({ 'ex-goblet': 12.5 })], 1)?.line).toBe(
      'Fait à 12,5 kg la dernière fois.'
    );
  });

  // Un mouvement au poids du corps n'a pas de charge : ce qui a été noté.
  it('sans charge, ce qui a été noté', () => {
    expect(traceAt([passage({ 'ex-goblet': null })], 1)?.line).toBe(
      '15 reps la dernière fois.'
    );
  });

  it('chaque ligne retrouve son mouvement, quelle que soit sa place hier', () => {
    const history = [passage({ 'ex-goblet': 24, 'ex-swing': 16 })];
    expect(traceAt(history, 0)?.line).toBe('Fait à 16 kg la dernière fois.');
    expect(traceAt(history, 1)?.line).toBe('Fait à 24 kg la dernière fois.');
  });

  it('le mot qui cite l’exercice, en corail quand il a fait mal', () => {
    const history = [
      passage({ 'ex-swing': 20 }),
      passage(
        { 'ex-swing': 20 },
        {
          clientNotes: 'Épaule un peu sensible sur les swings.',
          feedback: { effort: 4, tags: ['pain'] },
        }
      ),
    ];
    const trace = traceAt(history, 0);
    expect(trace?.quote).toBe('Épaule un peu sensible sur les swings.');
    expect(trace?.tone).toBe('warn');
    // Le mot ne parle pas du goblet : sa ligne n'en dit rien.
    expect(traceAt(history, 1)).toBeUndefined();
  });

  it('un mot sans douleur ni effort de trop se lit sans couleur', () => {
    const history = [
      passage(
        { 'ex-swing': 20 },
        {
          clientNotes: 'Les swings passent bien.',
          feedback: { effort: 3, tags: [] },
        }
      ),
    ];
    expect(traceAt(history, 0)?.tone).toBe('plain');
  });

  it('rien pour une séance jamais faite', () => {
    expect(exerciseTraces(session, []).size).toBe(0);
  });

  // Deux swings dans la séance : le premier répond au premier.
  it('un mouvement qui revient se lit par son rang d’apparition', () => {
    const twice = makeSession({
      blocks: [
        makeBlock({
          _id: 'a',
          exercises: [makeBlockExercise({ exercise: swing })],
        }),
        makeBlock({
          _id: 'b',
          exercises: [makeBlockExercise({ exercise: swing })],
        }),
      ],
    });
    const done = makeCompleted({
      completedAt: '2026-10-01T10:00:00.000Z',
      blocks: [
        makeBlockSnapshot({
          order: 1,
          exercises: [
            makeExerciseSnapshot({
              exercise: { _id: 'ex-swing', name: 'Kettlebell Swing' },
              performed: { sets: [{ reps: 15, weight: 12 }] },
            }),
          ],
        }),
        makeBlockSnapshot({
          order: 2,
          exercises: [
            makeExerciseSnapshot({
              exercise: { _id: 'ex-swing', name: 'Kettlebell Swing' },
              performed: { sets: [{ reps: 15, weight: 24 }] },
            }),
          ],
        }),
      ],
    });
    const traces = exerciseTraces(twice, [done]);
    expect(traces.get(traceKey('a', 0))?.line).toBe(
      'Fait à 12 kg la dernière fois.'
    );
    expect(traces.get(traceKey('b', 0))?.line).toBe(
      'Fait à 24 kg la dernière fois.'
    );
  });
});

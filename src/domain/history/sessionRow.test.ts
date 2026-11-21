/**
 * Ce qu'une ligne de « Tes séances » dit à côté de sa date.
 */
import { describe, expect, it } from 'vitest';
import {
  freeze,
  makeBlock,
  makeBlockExercise,
  makeCompleted,
  makeSession,
} from '@/domain/fixtures';
import { sessionMentions } from './sessionRow';

const session = makeSession({
  blocks: [
    makeBlock({ exercises: [makeBlockExercise({ sets: 3, reps: 12 })] }),
  ],
});
const done = (extra: Parameters<typeof makeCompleted>[0] = {}) =>
  makeCompleted({
    originalSessionId: session._id,
    blocks: session.blocks.map(freeze),
    feedback: { effort: 3 },
    ...extra,
  });

describe('les mentions d’une séance faite', () => {
  it('rien à dire : rien', () => {
    expect(sessionMentions(done(), [session])).toEqual([]);
  });

  // Une réponse se lisait seulement en ouvrant la séance.
  it('le coach a répondu : son prénom, le dernier', () => {
    const replies = [
      { coachId: 'c1', firstName: 'Marc', sentAt: '2026-08-30T19:00:00Z' },
      { coachId: 'c2', firstName: 'Julie', sentAt: '2026-08-31T08:00:00Z' },
    ];
    expect(sessionMentions(done({ replies }), [session])).toEqual([
      'Julie a répondu',
    ]);
  });

  it('un bilan d’avant l’échelle d’effort : ancien bilan', () => {
    const legacy = done({
      feedback: undefined,
      metrics: { stress: 1, mood: 5, energy: 4, sleep: 5, soreness: 1 },
    });
    expect(sessionMentions(legacy, [session])).toEqual(['ancien bilan']);
  });

  it('la séance a changé depuis : modifiée depuis', () => {
    const reworked = {
      ...session,
      blocks: [
        makeBlock({ exercises: [makeBlockExercise({ sets: 4, reps: 10 })] }),
      ],
    };
    expect(sessionMentions(done(), [reworked])).toEqual(['modifiée depuis']);
  });

  // Retirée du programme, elle n'a plus rien à quoi se comparer.
  it('retirée du programme : rien sur ce point', () => {
    expect(sessionMentions(done(), [])).toEqual([]);
  });

  it('corrigée : la date de la correction', () => {
    expect(
      sessionMentions(done({ editedAt: '2026-09-02T10:00:00Z' }), [session])
    ).toEqual(['corrigée le 2 sept.']);
  });
});

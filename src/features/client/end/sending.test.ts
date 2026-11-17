/**
 * Ce que la fin envoie au serveur, et la semaine qu'elle montre ensuite.
 *
 * Deux défauts muets s'y cachent : une série vide au milieu d'un exercice
 * envoyée comme si la suite avait eu lieu, et une séance déclarée « hier »
 * comptée aujourd'hui. Le premier se voit au serveur, le second un lundi.
 */
import { describe, expect, it } from 'vitest';
import {
  completionPayload,
  toChipperDone,
  toLadderDone,
  toPerformedEntries,
  toRoundsDone,
  weekAfter,
} from './sending';
import { makeSession } from '@/domain/fixtures';

describe('les charges envoyées', () => {
  it('s’adressent par « bloc : exercice »', () => {
    expect(
      toPerformedEntries({ '2:3': { sets: [{ weight: 26, reps: 10 }] } })
    ).toEqual([
      { blockOrder: 2, exerciseOrder: 3, sets: [{ weight: 26, reps: 10 }] },
    ]);
  });

  it('une série vide arrête l’exercice là', () => {
    const [entry] = toPerformedEntries({
      '1:1': { sets: [{ weight: 20 }, {}, { weight: 22 }] },
    });
    expect(entry.sets).toEqual([{ weight: 20 }]);
  });

  it('un exercice sans rien de noté ne part pas', () => {
    expect(
      toPerformedEntries({ '1:1': { sets: [{}] }, '1:2': { sets: [] } })
    ).toEqual([]);
  });
});

describe('les tours et les échelles', () => {
  it('zéro tour part aussi : le bloc a été vécu', () => {
    expect(toRoundsDone({ '3': 0, '4': 6 })).toEqual([
      { blockOrder: 3, rounds: 0 },
      { blockOrder: 4, rounds: 6 },
    ]);
  });

  it('rien de gardé, rien d’envoyé', () => {
    expect(toRoundsDone(undefined)).toEqual([]);
    expect(toLadderDone(undefined)).toEqual([]);
  });

  it('un chipper garde ses mouvements et son temps', () => {
    expect(toChipperDone(undefined)).toEqual([]);
    expect(toChipperDone({ '2': { movements: 3, seconds: 1200 } })).toEqual([
      { blockOrder: 2, movements: 3, seconds: 1200 },
    ]);
  });

  it('une échelle garde son palier et son temps', () => {
    expect(toLadderDone({ '1': { rungs: 5, seconds: 582 } })).toEqual([
      { blockOrder: 1, rungs: 5, seconds: 582 },
    ]);
  });
});

describe('ce qui part au serveur', () => {
  const feeling = { feedback: { effort: 4 }, clientNotes: 'Bien' };

  it('le ressenti, et rien de vide', () => {
    expect(completionPayload(null, feeling)).toEqual(feeling);
  });

  it('ce que l’appareil a gardé, chacun sous son nom', () => {
    const payload = completionPayload(
      {
        rounds: { '2': 5 },
        ladder: { '3': { rungs: 4, seconds: 720 } },
        chipper: { '4': { movements: 2, seconds: 1200 } },
      },
      { ...feeling, completedAt: '2026-11-17T09:00:00.000Z' },
      { '1:1': { sets: [{ weight: 20, reps: 8 }] } }
    );
    expect(payload).toEqual({
      ...feeling,
      completedAt: '2026-11-17T09:00:00.000Z',
      performed: [
        { blockOrder: 1, exerciseOrder: 1, sets: [{ weight: 20, reps: 8 }] },
      ],
      roundsDone: [{ blockOrder: 2, rounds: 5 }],
      ladderDone: [{ blockOrder: 3, rungs: 4, seconds: 720 }],
      chipperDone: [{ blockOrder: 4, movements: 2, seconds: 1200 }],
    });
  });
});

describe('la semaine après l’envoi', () => {
  // Mercredi 18 novembre 2026, midi.
  const now = new Date(2026, 10, 18, 12);
  const sessions = [
    makeSession({ _id: 's1', suggestedDays: [0, 2] }),
    makeSession({ _id: 's2', suggestedDays: [4] }),
  ];
  const monday = { completedAt: new Date(2026, 10, 16, 18).toISOString() };

  it('compte la séance qu’on vient d’envoyer', () => {
    const week = weekAfter([monday], sessions, undefined, now);
    expect(week).toMatchObject({ target: 3, before: 1, after: 2 });
    expect([...week.doneDays].sort()).toEqual([0, 2]);
  });

  it('à la date choisie, pas aujourd’hui', () => {
    const week = weekAfter([monday], sessions, '2026-11-17', now);
    expect([...week.doneDays].sort()).toEqual([0, 1]);
  });

  it('une séance d’une autre semaine ne remplit pas celle-ci', () => {
    const week = weekAfter([monday], sessions, '2026-11-13', now);
    expect(week.after).toBe(1);
  });
});

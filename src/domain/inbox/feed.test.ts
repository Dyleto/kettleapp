/**
 * Le fil « À lire » : l'ordre de lecture, les séances repliées, et ce
 * qu'une carte dit sans s'ouvrir.
 *
 * Le banc mène l'écran ; ici, les cas qu'il ne fabrique pas — un « trop
 * facile » qui n'en suit pas un autre, une séance calme seule chez son
 * client, une charge qui ne bouge pas, un mot de rien que des espaces.
 */
import { describe, expect, it } from 'vitest';
import type { CompletedSession, InboxItem } from '@/shared/types';
import {
  makeBlockSnapshot,
  makeCompleted,
  makeExerciseSnapshot,
} from '@/domain/fixtures';
import {
  clientLabel,
  concernOf,
  doneChips,
  feedOf,
  noteOf,
  tagsInOrder,
  whenLabel,
} from './feed';

const SARAH = { _id: 'client-sarah', firstName: 'Sarah', lastName: 'Martin' };
const THOMAS = {
  _id: 'client-thomas',
  firstName: 'Thomas',
  lastName: 'Bernard',
};

/** Une carte du fil : un client, une séance, et ce qui l'a précédée. */
const item = (
  completed: Partial<CompletedSession> = {},
  options: { client?: typeof SARAH; previous?: Partial<CompletedSession> } = {}
): InboxItem => ({
  client: options.client ?? SARAH,
  completed: makeCompleted({
    _id: `bilan-${completed.completedAt ?? 'x'}-${completed.feedback?.effort ?? 0}`,
    ...completed,
  }),
  previous: options.previous ? makeCompleted(options.previous) : undefined,
});

const feeling = (effort: number, tags: string[] = []) =>
  ({ effort, tags }) as CompletedSession['feedback'];

describe('ce qu’une séance demande au coach', () => {
  it('« Trop dure » ou une douleur : d’abord', () => {
    expect(concernOf(item({ feedback: feeling(5) }))).toBe('alert');
    expect(concernOf(item({ feedback: feeling(3, ['pain']) }))).toBe('alert');
  });

  // Une fois peut être un bon jour ; deux fois, c'est la séance.
  it('« Trop facile » deux fois de suite sur la même séance', () => {
    expect(
      concernOf(
        item({ feedback: feeling(1) }, { previous: { feedback: feeling(1) } })
      )
    ).toBe('repeatedEasy');
    expect(
      concernOf(
        item({ feedback: feeling(1) }, { previous: { feedback: feeling(3) } })
      )
    ).toBe('other');
    expect(concernOf(item({ feedback: feeling(1) }))).toBe('other');
  });

  it('« Juste », sans un mot ni rien d’inquiétant : calme', () => {
    expect(concernOf(item({ feedback: feeling(3) }))).toBe('quiet');
    expect(concernOf(item({ feedback: feeling(3, ['great_shape']) }))).toBe(
      'quiet'
    );
  });

  // Un mot du client n'est jamais calme : il l'a écrit pour être lu.
  it('un mot, ou une fatigue, et ce n’est plus calme', () => {
    expect(
      concernOf(item({ feedback: feeling(3), clientNotes: 'Bon rythme.' }))
    ).toBe('other');
    expect(concernOf(item({ feedback: feeling(3, ['fatigue']) }))).toBe(
      'other'
    );
  });

  it('un mot de rien que des espaces ne compte pas', () => {
    expect(concernOf(item({ feedback: feeling(3), clientNotes: '   ' }))).toBe(
      'quiet'
    );
  });

  // Un ancien bilan à cinq axes n'a pas d'effort : il ne passe pas devant.
  it('un ancien bilan sans effort se lit avec le reste', () => {
    expect(concernOf(item({ feedback: undefined }))).toBe('other');
  });
});

describe('l’ordre de lecture', () => {
  const at = (day: number) =>
    `2026-11-${String(day).padStart(2, '0')}T18:00:00.000Z`;

  it('ce qui fait mal, puis ce qui est mal réglé, puis le reste par date', () => {
    const old = item({ completedAt: at(10), feedback: feeling(4) });
    const recent = item({ completedAt: at(16), feedback: feeling(2) });
    const easy = item(
      { completedAt: at(12), feedback: feeling(1) },
      { previous: { feedback: feeling(1) } }
    );
    const hurt = item({ completedAt: at(11), feedback: feeling(5) });
    const feed = feedOf([old, recent, easy, hurt]);
    expect(
      feed.map((entry) => (entry.kind === 'card' ? entry.item : null))
    ).toEqual([hurt, easy, recent, old]);
  });

  it('deux séances calmes d’un client se replient en une ligne', () => {
    const a = item(
      { completedAt: at(14), feedback: feeling(3) },
      { client: THOMAS }
    );
    const b = item(
      { completedAt: at(15), feedback: feeling(3) },
      { client: THOMAS }
    );
    const feed = feedOf([a, b]);
    expect(feed).toHaveLength(1);
    expect(feed[0]).toEqual({
      kind: 'fold',
      clientId: THOMAS._id,
      items: [b, a],
    });
  });

  // La replier ne cacherait rien, et la rendrait moins lisible.
  it('seule, une séance calme reste une carte', () => {
    const feed = feedOf([item({ feedback: feeling(3) }, { client: THOMAS })]);
    expect(feed[0].kind).toBe('card');
  });

  it('les séances calmes de deux clients ne se mêlent pas', () => {
    const feed = feedOf([
      item({ completedAt: at(14), feedback: feeling(3) }, { client: THOMAS }),
      item({ completedAt: at(15), feedback: feeling(3) }, { client: THOMAS }),
      item({ completedAt: at(13), feedback: feeling(3) }, { client: SARAH }),
    ]);
    expect(feed.map((entry) => entry.kind)).toEqual(['fold', 'card']);
  });

  it('la ligne repliée prend la date de sa séance la plus récente', () => {
    const lateNews = item({ completedAt: at(15), feedback: feeling(2) });
    const feed = feedOf([
      item({ completedAt: at(10), feedback: feeling(3) }, { client: THOMAS }),
      item({ completedAt: at(16), feedback: feeling(3) }, { client: THOMAS }),
      lateNews,
    ]);
    expect(feed.map((entry) => entry.kind)).toEqual(['fold', 'card']);
  });
});

describe('ce qui a été fait, en pastilles', () => {
  const lifted = (id: string, name: string, weight?: number) =>
    makeExerciseSnapshot({
      exercise: { _id: id, name },
      performed:
        weight === undefined ? undefined : { sets: [{ weight, reps: 10 }] },
    });
  const session = (...exercises: ReturnType<typeof lifted>[]) => ({
    blocks: [makeBlockSnapshot({ exercises })],
  });

  it('une charge qui monte, une qui baisse, comparées au passage d’avant', () => {
    const chips = doneChips(
      item(
        session(
          lifted('goblet', 'Goblet Squat', 26),
          lifted('swing', 'Swing', 16)
        ),
        {
          previous: session(
            lifted('goblet', 'Goblet Squat', 24),
            lifted('swing', 'Swing', 20)
          ),
        }
      )
    );
    expect(chips.chips).toEqual([
      { text: 'Goblet Squat 26 kg ↗', tone: 'up' },
      { text: 'Swing 16 kg ↘', tone: 'down' },
    ]);
  });

  // Le coach cherche ce qui a changé : une charge tenue ne lui dit rien.
  it('une charge qui ne bouge pas ne fait pas de pastille', () => {
    expect(
      doneChips(
        item(session(lifted('goblet', 'Goblet Squat', 24)), {
          previous: session(lifted('goblet', 'Goblet Squat', 24)),
        })
      ).chips
    ).toEqual([]);
  });

  it('sans passage d’avant, rien ne se compare', () => {
    expect(
      doneChips(item(session(lifted('goblet', 'Goblet Squat', 24)))).chips
    ).toEqual([]);
  });

  it('un score se lit tel quel : tours, paliers, mouvements', () => {
    const chips = doneChips(
      item({
        blocks: [
          makeBlockSnapshot({ type: 'amrap', order: 1, performedRounds: 5 }),
          makeBlockSnapshot({
            type: 'ladder',
            order: 2,
            performedRungs: 5,
            repsScheme: [1, 2, 3, 4, 5, 6, 7],
          }),
          makeBlockSnapshot({
            type: 'chipper',
            order: 3,
            performedMovements: 2,
          }),
        ],
      })
    ).chips;
    expect(chips.map((chip) => chip.tone)).toEqual(['score', 'score', 'score']);
    expect(chips[0].text).toMatch(/5 tours$/);
    expect(chips[1].text).toBe('palier 5 sur 7');
    expect(chips[2].text).toMatch(/2 sur 1$/);
  });

  it('trois au plus, puis le compte du reste', () => {
    const now = session(
      lifted('a', 'A', 11),
      lifted('b', 'B', 12),
      lifted('c', 'C', 13),
      lifted('d', 'D', 14),
      lifted('e', 'E', 15)
    );
    const before = session(
      lifted('a', 'A', 10),
      lifted('b', 'B', 10),
      lifted('c', 'C', 10),
      lifted('d', 'D', 10),
      lifted('e', 'E', 10)
    );
    const { chips, more } = doneChips(item(now, { previous: before }));
    expect(chips).toHaveLength(3);
    expect(more).toBe(2);
  });
});

describe('ce que la carte dit à la place du mot', () => {
  it('le mot du client, sans ses espaces', () => {
    expect(noteOf(item({ clientNotes: ' Dur sur la fin. ' }))).toEqual({
      kind: 'quote',
      text: 'Dur sur la fin.',
    });
  });

  it('sans mot, un « trop facile » qui se répète se dit', () => {
    expect(
      noteOf(
        item({ feedback: feeling(1) }, { previous: { feedback: feeling(1) } })
      )
    ).toEqual({
      kind: 'hint',
      text: 'Aucun mot. Deuxième « trop facile » de suite.',
    });
  });

  // « Aucun mot » sous chaque carte calme serait du bruit.
  it('sans mot et sans rien à dire : rien', () => {
    expect(noteOf(item({ feedback: feeling(3) }))).toBeNull();
  });
});

describe('quand', () => {
  const now = new Date(2026, 10, 18, 10, 0);

  it('aujourd’hui et hier, à l’heure près', () => {
    expect(whenLabel(new Date(2026, 10, 18, 9, 5).toISOString(), now)).toBe(
      'aujourd’hui, 9 h'
    );
    expect(whenLabel(new Date(2026, 10, 17, 18, 30).toISOString(), now)).toBe(
      'hier, 18 h'
    );
  });

  // Une séance de 23 h 30 relue à 0 h 30 est d'hier — à Paris. En UTC,
  // les deux tombent le même jour : c'est l'heure de l'écran qui compte.
  // Les tests tournent en UTC, où l'erreur ne se voit pas : celui-ci prend
  // le fuseau d'un coach.
  it('au jour près, en heure locale', () => {
    const zone = process.env.TZ;
    process.env.TZ = 'Europe/Paris';
    try {
      expect(
        whenLabel(
          '2026-11-17T22:30:00.000Z',
          new Date('2026-11-17T23:30:00.000Z')
        )
      ).toBe('hier, 23 h');
    } finally {
      process.env.TZ = zone;
    }
  });

  it('il y a quelques jours, puis la date', () => {
    expect(whenLabel(new Date(2026, 10, 15, 18).toISOString(), now)).toBe(
      'il y a 3 jours'
    );
    expect(whenLabel(new Date(2026, 10, 2, 18).toISOString(), now)).toMatch(
      /2 novembre/
    );
  });
});

describe('ce que la carte nomme', () => {
  it('le client par son nom, ou « Client sans nom »', () => {
    expect(clientLabel(SARAH)).toBe('Sarah Martin');
    expect(clientLabel({ _id: 'sans-compte' })).toBe('Client sans nom');
    expect(clientLabel({ _id: 'x', firstName: ' ', lastName: '' })).toBe(
      'Client sans nom'
    );
  });

  // La douleur fait passer la séance devant : elle se lit la première.
  it('la douleur d’abord, le reste dans son ordre', () => {
    expect(tagsInOrder(['fatigue', 'pain', 'stress'])).toEqual([
      'pain',
      'fatigue',
      'stress',
    ]);
  });
});

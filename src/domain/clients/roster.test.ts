/**
 * La liste des clients : la ligne d'état, les tuiles de tête, l'ordre et la
 * recherche. Le jour est figé au samedi 5 septembre 2026, midi.
 */
import { describe, expect, it } from 'vitest';
import type { Client } from '@/shared/types';
import {
  clientName,
  followedSince,
  previewHeadline,
  weekSummary,
  effortTrend,
  matchesQuery,
  passesFilter,
  sortClients,
  statusLine,
  tileCounts,
} from './roster';

const NOW = new Date('2026-09-05T12:00:00.000Z');
const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 86_400_000).toISOString();

const client = (overrides: Partial<Client> = {}): Client => ({
  _id: 'c1',
  firstName: 'Sarah',
  lastName: 'Martin',
  unseenCount: 0,
  linkedAt: daysAgo(90),
  lastCompletedAt: daysAgo(2),
  tagIds: [],
  weekDone: 1,
  weekTarget: 3,
  sessionCount: 3,
  recentEfforts: [3, 3],
  ...overrides,
});

describe('la tendance', () => {
  it('deux ressentis durs de suite : la séance devient trop dure', () => {
    expect(effortTrend([3, 3, 3, 4, 5])).toBe('hard');
  });

  it('deux faciles de suite : trop facile', () => {
    expect(effortTrend([3, 1, 2])).toBe('easy');
  });

  // Une séance dure après une nuit courte ne dit rien du programme.
  it('un seul, ou deux de côtés différents : rien', () => {
    expect(effortTrend([5])).toBeNull();
    expect(effortTrend([4, 3])).toBeNull();
    expect(effortTrend([])).toBeNull();
  });

  it('deux « Juste » : rien à régler', () => {
    expect(effortTrend([3, 3])).toBeNull();
  });
});

describe('la ligne d’état', () => {
  it('des séances à lire, en ambre', () => {
    expect(statusLine(client({ unseenCount: 3 }), NOW)).toEqual({
      text: '3 séances à lire',
      tone: 'amber',
    });
    expect(statusLine(client({ unseenCount: 1 }), NOW).text).toBe(
      '1 séance à lire'
    );
  });

  it('à lire, et la tendance qui le rend urgent', () => {
    expect(
      statusLine(client({ unseenCount: 1, recentEfforts: [3, 4, 5] }), NOW)
    ).toEqual({ text: '1 à lire · devient trop dure', tone: 'coral' });
    expect(
      statusLine(client({ unseenCount: 2, recentEfforts: [3, 1, 1] }), NOW)
    ).toEqual({ text: '2 à lire · trop facile', tone: 'blue' });
  });

  it('un programme vide : à écrire, un nouveau suivi s’il vient d’arriver', () => {
    const fresh = client({
      sessionCount: 0,
      linkedAt: daysAgo(3),
      lastCompletedAt: undefined,
    });
    expect(statusLine(fresh, NOW)).toEqual({
      text: 'nouveau suivi · programme à écrire',
      tone: 'muted',
    });
    expect(statusLine({ ...fresh, linkedAt: daysAgo(40) }, NOW).text).toBe(
      'programme à écrire'
    );
  });

  it('plus de quatorze jours sans séance : à relancer, en corail', () => {
    expect(statusLine(client({ lastCompletedAt: daysAgo(21) }), NOW)).toEqual({
      text: 'rien depuis 3 semaines',
      tone: 'coral',
    });
  });

  it('quatorze jours tout juste : pas encore', () => {
    expect(statusLine(client({ lastCompletedAt: daysAgo(14) }), NOW).text).toBe(
      'à jour'
    );
  });

  it('au-delà de deux mois, on compte en mois', () => {
    expect(statusLine(client({ lastCompletedAt: daysAgo(70) }), NOW).text).toBe(
      'rien depuis 2 mois'
    );
  });

  // « jamais démarré » s'accordait avec quelqu'un dont on ignore le genre.
  it('jamais une séance depuis son arrivée : la ligne le dit sans accorder', () => {
    expect(
      statusLine(
        client({ lastCompletedAt: undefined, linkedAt: daysAgo(20) }),
        NOW
      ).text
    ).toBe('aucune séance depuis 2 semaines');
  });

  it('rien à lire, mais mal réglée : la tendance seule', () => {
    expect(statusLine(client({ recentEfforts: [2, 1] }), NOW)).toEqual({
      text: 'trop facile',
      tone: 'blue',
    });
  });

  it('sinon, à jour, en vert', () => {
    expect(statusLine(client(), NOW)).toEqual({
      text: 'à jour',
      tone: 'green',
    });
  });
});

// Les six clients de la maquette.
const ROSTER: Client[] = [
  client({
    _id: 'lea',
    firstName: 'Léa',
    lastName: 'Dubois',
    recentEfforts: [1, 3, 3],
    lastCompletedAt: daysAgo(3),
  }),
  client({
    _id: 'manon',
    firstName: 'Manon',
    lastName: 'Petit',
    sessionCount: 0,
    lastCompletedAt: undefined,
    linkedAt: daysAgo(2),
    recentEfforts: [],
  }),
  client({
    _id: 'karim',
    firstName: 'Karim',
    lastName: 'Haddad',
    lastCompletedAt: daysAgo(22),
    recentEfforts: [3, 4],
  }),
  client({
    _id: 'julien',
    firstName: 'Julien',
    lastName: 'Moreau',
    unseenCount: 2,
    recentEfforts: [3, 3, 1, 1],
    lastCompletedAt: daysAgo(3),
  }),
  client({
    _id: 'sarah',
    firstName: 'Sarah',
    lastName: 'Martin',
    unseenCount: 1,
    recentEfforts: [3, 3, 3, 4, 5],
    lastCompletedAt: daysAgo(1),
  }),
  client({
    _id: 'thomas',
    firstName: 'Thomas',
    lastName: 'Bernard',
    unseenCount: 3,
    recentEfforts: [3, 3, 3, 3, 3],
    lastCompletedAt: daysAgo(1),
  }),
];

describe('les tuiles de tête', () => {
  it('six à lire chez trois clients, un à relancer, deux mal réglés', () => {
    expect(tileCounts(ROSTER, NOW)).toEqual({
      unreadSessions: 6,
      unreadClients: 3,
      silent: 1,
      misjudged: 2,
    });
  });

  // Une tuile qui dit « 2 » montre deux lignes.
  it('chaque tuile filtre exactement ce qu’elle compte', () => {
    const ids = (filter: Parameters<typeof passesFilter>[1]) =>
      ROSTER.filter((c) => passesFilter(c, filter, NOW)).map((c) => c._id);
    expect(ids('unread')).toEqual(['julien', 'sarah', 'thomas']);
    expect(ids('silent')).toEqual(['karim']);
    expect(ids('misjudged')).toEqual(['julien', 'sarah']);
  });

  // Sans programme, c'est au coach d'écrire, pas de relancer.
  it('un programme vide n’est pas à relancer, même ancien', () => {
    const empty = client({
      sessionCount: 0,
      linkedAt: daysAgo(60),
      lastCompletedAt: undefined,
    });
    expect(passesFilter(empty, 'silent', NOW)).toBe(false);
  });
});

describe('l’ordre de la liste', () => {
  const order = (sort: Parameters<typeof sortClients>[1]) =>
    sortClients(ROSTER, sort, NOW).map((c) => c._id);

  it('à traiter : à lire (les plus nombreuses d’abord), à relancer, puis par activité', () => {
    expect(order('triage')).toEqual([
      'thomas',
      'julien',
      'sarah',
      'karim',
      'manon',
      'lea',
    ]);
  });

  it('activité : la plus récente d’abord', () => {
    expect(order('recent')).toEqual([
      'sarah',
      'thomas',
      'manon',
      'julien',
      'lea',
      'karim',
    ]);
  });

  it('A → Z, par prénom puis nom, sans tenir compte des accents', () => {
    expect(order('alpha')).toEqual([
      'julien',
      'karim',
      'lea',
      'manon',
      'sarah',
      'thomas',
    ]);
  });

  it('deux silences : le plus long d’abord', () => {
    const long = client({ _id: 'long', lastCompletedAt: daysAgo(40) });
    const short = client({ _id: 'short', lastCompletedAt: daysAgo(20) });
    expect(sortClients([short, long], 'triage', NOW).map((c) => c._id)).toEqual(
      ['long', 'short']
    );
  });
});

describe('la recherche', () => {
  const lea = ROSTER[0];

  it('sans accent ni casse', () => {
    expect(matchesQuery(lea, 'LEA')).toBe(true);
    expect(matchesQuery(lea, 'dubo')).toBe(true);
  });

  it('chaque mot, où qu’il soit', () => {
    expect(matchesQuery(lea, 'du lé')).toBe(true);
    expect(matchesQuery(lea, 'léa martin')).toBe(false);
  });

  it('rien tapé : tout le monde', () => {
    expect(matchesQuery(lea, '  ')).toBe(true);
  });
});

describe('le nom', () => {
  it('un compte sans nom se dit', () => {
    expect(
      clientName(client({ firstName: undefined, lastName: undefined }))
    ).toBe('Client sans nom');
  });
});

describe('le panneau d’un client', () => {
  it('l’ancienneté du suivi, le premier du mois en « 1er »', () => {
    expect(followedSince('2026-06-01T10:00:00.000Z', NOW)).toBe(
      'avec toi depuis le 1er juin'
    );
    expect(followedSince('2026-03-14T10:00:00.000Z', NOW)).toBe(
      'avec toi depuis le 14 mars'
    );
  });

  it('une autre année se date avec elle', () => {
    expect(followedSince('2025-11-03T10:00:00.000Z', NOW)).toBe(
      'avec toi depuis le 3 novembre 2025'
    );
  });

  it('la semaine, puis le total', () => {
    expect(weekSummary(client(), { total: 6, complete: true })).toBe(
      '1 séance sur 3 cette semaine · 6 séances au total'
    );
  });

  // L'historique arrive par sa propre requête.
  it('tant que l’historique n’est pas là : la semaine seule', () => {
    expect(weekSummary(client())).toBe('1 séance sur 3 cette semaine');
  });

  it('sans jour conseillé, pas d’objectif ; une page pleine, « au moins »', () => {
    expect(
      weekSummary(client({ weekTarget: 0, weekDone: 0 }), {
        total: 50,
        complete: false,
      })
    ).toBe('aucune séance cette semaine · au moins 50 séances');
    expect(
      weekSummary(client({ weekTarget: 0, weekDone: 0 }), {
        total: 0,
        complete: true,
      })
    ).toBe('aucune séance cette semaine');
  });

  it('la tendance de la ligne passe avant la série', () => {
    expect(previewHeadline(client({ recentEfforts: [3, 4, 5] }))).toEqual({
      text: 'Devient trop dure',
      tone: 'hard',
    });
  });

  it('sans tendance, la série en cours, dite comme dans le journal', () => {
    expect(previewHeadline(client({ recentEfforts: [1, 3, 3, 3] }))).toEqual({
      text: 'Les trois dernières : justes',
      tone: 'target',
    });
    expect(previewHeadline(client({ recentEfforts: [] }))).toEqual({
      text: 'Aucun ressenti donné',
      tone: null,
    });
  });
});

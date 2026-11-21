/**
 * Les ressentis d'un client : les cinq points, la phrase, le rythme, les
 * étiquettes et le calendrier.
 */
import { describe, expect, it } from 'vitest';
import type { CompletedSession, FeedbackTag } from '@/shared/types';
import { makeCompleted } from '@/domain/fixtures';
import {
  calendarBounds,
  calendarMarks,
  sessionsByDay,
  latestByDay,
  recentZones,
  rhythmLine,
  rowDate,
  streakHeadline,
  tagCountLabel,
  tagCounts,
  withTag,
} from './journal';

/** Une séance faite le `day` (« 2026-08-30 »), à 18 h UTC. Les dates sont
 * écrites, pas comptées : deux décors identiques le sont vraiment. */
const done = (
  day: string,
  effort?: number,
  tags: FeedbackTag[] = [],
  extra: Partial<CompletedSession> = {}
) =>
  makeCompleted({
    _id: `bilan-${day}`,
    completedAt: `${day}T18:00:00.000Z`,
    feedback: effort === undefined ? undefined : { effort, tags },
    ...extra,
  });

// Le décor du banc : six séances du 12 au 30 août, dont un ancien bilan.
const AUGUST = [
  done('2026-08-30', 5, ['fatigue']),
  done('2026-08-12', 3),
  done('2026-08-26', 4, ['pain']),
  done('2026-08-16', undefined, [], {
    metrics: { stress: 1, mood: 5, energy: 4, sleep: 5, soreness: 1 },
  }),
  done('2026-08-22', 3),
  done('2026-08-19', 4, ['fatigue', 'poor_sleep']),
];
// Le dimanche 30 août au soir, heure de Paris.
const SUNDAY = new Date('2026-08-30T20:00:00.000Z');

describe('les cinq points', () => {
  it('les cinq dernières séances, de la plus ancienne à la plus récente', () => {
    expect(recentZones(AUGUST)).toEqual([
      null,
      'hard',
      'target',
      'hard',
      'hard',
    ]);
  });

  // Un ancien bilan reste un passage : le sauter ferait remonter une
  // séance plus ancienne dans les points.
  it('un ancien bilan est un point vide, pas un point sauté', () => {
    expect(recentZones(AUGUST)[0]).toBeNull();
    expect(recentZones(AUGUST.slice(0, 5))).toHaveLength(5);
  });

  it('moins de cinq séances : des points vides devant', () => {
    expect(recentZones([done('2026-08-30', 2)])).toEqual([
      null,
      null,
      null,
      null,
      'easy',
    ]);
  });
});

describe('la phrase', () => {
  it('« Les deux dernières : dures »', () => {
    expect(streakHeadline(AUGUST)).toEqual({
      text: 'Les deux dernières : dures',
      tone: 'hard',
    });
  });

  // « Dure » et « Trop dure » sont du même côté : la série tient.
  it('une série se compte par zone, pas par cran', () => {
    const history = [done('2026-08-01', 4), done('2026-08-02', 5)];
    expect(streakHeadline(history).text).toBe('Les deux dernières : dures');
  });

  // Un ancien bilan au milieu n'a pas de côté : il n'interrompt pas.
  it('un ancien bilan n’interrompt pas une série', () => {
    const history = [
      done('2026-08-01', 3),
      done('2026-08-02', 3),
      done('2026-08-03'),
      done('2026-08-04', 3),
    ];
    expect(streakHeadline(history)).toEqual({
      text: 'Les trois dernières : justes',
      tone: 'target',
    });
  });

  it('une seule du côté de la dernière : « La dernière : facile »', () => {
    const history = [done('2026-08-01', 4), done('2026-08-02', 1)];
    expect(streakHeadline(history)).toEqual({
      text: 'La dernière : facile',
      tone: 'easy',
    });
  });

  it('aucun ressenti : il le dit, sans couleur', () => {
    expect(streakHeadline([done('2026-08-01')])).toEqual({
      text: 'Aucun ressenti donné',
      tone: null,
    });
  });
});

describe('le rythme', () => {
  it('depuis quand, combien par semaine, et cette semaine', () => {
    expect(rhythmLine(AUGUST, { target: 3, now: SUNDAY })).toBe(
      '6 séances depuis le 12 août · 1,5 par semaine · 2 sur 3 cette semaine'
    );
  });

  // Quatre semaines et non tout l'historique : un client revenu de
  // vacances a repris, et une moyenne de l'année l'effacerait.
  it('la moyenne ne regarde que les quatre dernières semaines', () => {
    const history = [
      done('2025-11-03', 3),
      done('2025-11-05', 3),
      ...AUGUST,
      done('2026-08-28', 3),
      done('2026-08-29', 3),
    ];
    expect(rhythmLine(history, { target: 3, now: SUNDAY })).toContain(
      '2 par semaine'
    );
  });

  it('sous quatre séances, le compte plutôt qu’une moyenne', () => {
    const history = [done('2026-08-20', 3), done('2026-08-27', 3)];
    expect(rhythmLine(history, { target: 0, now: SUNDAY })).toBe(
      '2 séances depuis le 20 août · 2 en quatre semaines · 1 cette semaine'
    );
  });

  it('rien depuis un mois : il le dit', () => {
    const history = [done('2026-06-01', 3), done('2026-06-03', 3)];
    expect(rhythmLine(history, { target: 2, now: SUNDAY })).toBe(
      '2 séances depuis le 1 juin · aucune ces quatre dernières semaines · 0 sur 2 cette semaine'
    );
  });

  it('une seule séance : sa date, sans « depuis »', () => {
    expect(
      rhythmLine([done('2026-08-19', 3)], { target: 0, now: SUNDAY })
    ).toBe('1 séance, le 19 août · 1 en quatre semaines');
  });

  it('une autre année se date avec elle', () => {
    expect(
      rhythmLine([done('2025-08-26', 3), done('2026-08-26', 3)], {
        target: 0,
        now: SUNDAY,
      })
    ).toMatch(/^2 séances depuis le 26 août 2025/);
  });

  // L'historique arrive par pages : la plus ancienne reçue n'est pas la
  // première, et « 6 séances depuis » mentirait.
  it('un historique tronqué ne prétend pas savoir depuis quand', () => {
    expect(
      rhythmLine(AUGUST, { target: 3, now: SUNDAY, complete: false })
    ).toMatch(/^Les 6 dernières depuis le 12 août · /);
  });
});

describe('les étiquettes', () => {
  it('sur tout l’historique, la douleur d’abord, puis le compte', () => {
    expect(tagCounts(AUGUST).map(tagCountLabel)).toEqual([
      'Douleur × 1',
      'Fatigue × 2',
      'Mal dormi × 1',
    ]);
  });

  // La pastille filtre : la liste doit compter ce qu'elle annonce.
  it('une étiquette filtre autant de séances que son compte', () => {
    for (const { tag, count } of tagCounts(AUGUST))
      expect(withTag(AUGUST, tag)).toHaveLength(count);
    expect(withTag(AUGUST, null)).toHaveLength(AUGUST.length);
  });

  it('une étiquette posée deux fois sur une séance compte une fois', () => {
    const twice = [done('2026-08-01', 4, ['pain', 'pain'])];
    expect(tagCounts(twice)).toEqual([{ tag: 'pain', count: 1 }]);
  });
});

describe('les dates', () => {
  it('une ligne se date sans relatif : « dim. 30 août »', () => {
    expect(rowDate('2026-08-30T18:00:00.000Z', SUNDAY)).toBe('dim. 30 août');
  });

  it('une autre année se date avec elle', () => {
    expect(rowDate('2025-08-30T18:00:00.000Z', SUNDAY)).toBe(
      'sam. 30 août 2025'
    );
  });
});

describe('le calendrier', () => {
  it('une pastille par jour : la séance la plus récente du jour', () => {
    const morning = done('2026-08-30', 2, [], {
      _id: 'matin',
      completedAt: '2026-08-30T07:00:00.000Z',
    });
    const days = latestByDay([...AUGUST, morning]);
    expect(days.get('2026-08-30')?._id).toBe('bilan-2026-08-30');
    expect(days.size).toBe(6);
  });

  // Il ouvre sur le mois de la dernière séance, pas sur un mois vide.
  it('il ouvre sur la dernière séance, et va jusqu’au mois en cours', () => {
    const november = new Date('2026-11-20T10:00:00.000Z');
    const bounds = calendarBounds(AUGUST, november);
    expect(bounds.start).toEqual(new Date(2026, 7));
    expect(bounds.first).toEqual(new Date(2026, 7));
    expect(bounds.last).toEqual(new Date(2026, 10));
  });

  it('sans séance, le mois en cours seul', () => {
    const november = new Date('2026-11-20T10:00:00.000Z');
    expect(calendarBounds([], november)).toEqual({
      first: new Date(2026, 10),
      last: new Date(2026, 10),
      start: new Date(2026, 10),
    });
  });
});

describe('les marques du calendrier', () => {
  it('la zone de la séance, et ce qu’un lecteur d’écran entend', () => {
    const marks = calendarMarks(AUGUST);
    expect(marks.get('2026-08-30')).toEqual({
      zone: 'hard',
      label: 'dimanche 30 août : Séance 1, Trop dure',
    });
    expect(marks.get('2026-08-16')).toEqual({
      zone: null,
      label: 'dimanche 16 août : Séance 1',
    });
  });

  // La seconde séance d'un jour ne se perd pas.
  it('deux séances le même jour : les deux, la plus récente d’abord', () => {
    const morning = done('2026-08-30', 2, [], {
      _id: 'matin',
      completedAt: '2026-08-30T07:00:00.000Z',
    });
    const history = [morning, ...AUGUST];
    expect(
      sessionsByDay(history)
        .get('2026-08-30')
        ?.map((c) => c._id)
    ).toEqual(['bilan-2026-08-30', 'matin']);
    expect(calendarMarks(history).get('2026-08-30')).toEqual({
      zone: 'hard',
      label: 'dimanche 30 août : 2 séances',
    });
  });
});

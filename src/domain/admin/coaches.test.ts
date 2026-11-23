import { describe, expect, it } from 'vitest';
import type { AdminCoach, AdminStats } from '@/shared/types';
import { coachFacts, coachName, isEmailLike, statTiles } from './coaches';

const STATS: AdminStats = {
  coachCount: 4,
  clientCount: 31,
  sessionCount: 512,
  sessionTodayCount: 9,
  exerciseCount: 148,
};

const JULIE: AdminCoach = {
  _id: '64c000000000000000000001',
  firstName: 'Julie',
  lastName: 'Martin',
  email: 'julie@example.com',
  clientCount: 12,
  exerciseCount: 64,
  createdAt: '2026-02-10T09:00:00.000Z',
};

describe('statTiles', () => {
  it('les quatre nombres, dans l’ordre, et les séances du jour', () => {
    expect(
      statTiles(STATS).map((t) => [t.count, t.label, t.sub ?? ''])
    ).toEqual([
      [4, 'coachs', ''],
      [31, 'clients', ''],
      [512, 'séances faites', "+ 9 aujourd'hui"],
      [148, 'exercices créés', ''],
    ]);
  });

  // La page écrivait « Coachs » au-dessus d'un 1.
  it('un seul s’écrit au singulier, zéro aussi', () => {
    const tiles = statTiles({
      coachCount: 1,
      clientCount: 0,
      sessionCount: 1,
      sessionTodayCount: 0,
      exerciseCount: 1,
    });
    expect(tiles.map((t) => t.label)).toEqual([
      'coach',
      'client',
      'séance faite',
      'exercice créé',
    ]);
  });

  it('aucune séance aujourd’hui : rien sous le nombre', () => {
    const tiles = statTiles({ ...STATS, sessionTodayCount: 0 });
    expect(tiles[2].sub).toBeUndefined();
  });
});

describe('coachName', () => {
  it('le prénom et le nom', () => {
    expect(coachName(JULIE)).toBe('Julie Martin');
  });

  // Un compte ouvert sans nom attend celui de Google : la ligne affichait
  // une espace seule.
  it('sans nom, l’adresse', () => {
    expect(coachName({ email: 'ines@example.com' })).toBe('ines@example.com');
  });
});

describe('coachFacts', () => {
  it('les clients, les exercices, et le mois d’arrivée', () => {
    expect(coachFacts(JULIE)).toEqual({
      clients: '12 clients',
      exercises: '64 exercices',
      since: 'depuis février 2026',
    });
  });

  it('au singulier à un et à zéro', () => {
    const facts = coachFacts({ ...JULIE, clientCount: 1, exerciseCount: 0 });
    expect([facts.clients, facts.exercises]).toEqual([
      '1 client',
      '0 exercice',
    ]);
  });
});

describe('isEmailLike', () => {
  it.each([
    ['ines@example.com', true],
    ['  ines@example.com ', true],
    ['ines@example', false],
    ['ines.example.com', false],
    ['ines @example.com', false],
    ['', false],
  ])('« %s » → %s', (text, expected) => {
    expect(isEmailLike(text)).toBe(expected);
  });
});

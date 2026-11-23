import { describe, expect, it } from 'vitest';
import { otherSpaces, spaceOf } from './routes';

const both = { isClient: true, isCoach: true, isAdmin: false };

describe('spaceOf', () => {
  it.each([
    ['/coach/clients', 'coach'],
    ['/client/account', 'client'],
    ['/admin', 'admin'],
    ['/login', null],
  ])('%s → %s', (path, space) => {
    expect(spaceOf(path)).toBe(space);
  });
});

describe('otherSpaces', () => {
  it('un compte à deux rôles, côté client : l’espace coach seulement', () => {
    expect(otherSpaces(both, '/client').map((s) => s.label)).toEqual([
      'Passer à l’espace coach',
    ]);
  });

  // Le menu proposait aussi l'espace où l'on était : le toucher ne
  // changeait rien.
  it('jamais l’espace où l’on est', () => {
    expect(otherSpaces(both, '/coach/clients').map((s) => s.space)).toEqual([
      'client',
    ]);
  });

  it('un compte à un seul rôle n’a nulle part où passer', () => {
    expect(
      otherSpaces({ isClient: true, isCoach: false, isAdmin: false }, '/client')
    ).toEqual([]);
  });

  it('l’administrateur coach, depuis l’administration', () => {
    expect(
      otherSpaces({ isClient: false, isCoach: true, isAdmin: true }, '/admin')
    ).toEqual([
      { space: 'coach', label: 'Passer à l’espace coach', to: '/coach' },
    ]);
  });
});

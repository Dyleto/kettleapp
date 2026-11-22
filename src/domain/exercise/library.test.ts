/** La bibliothèque : son ordre, sa recherche, ce qu'elle propose de créer. */
import { describe, expect, it } from 'vitest';
import type { Exercise } from '@/shared/types';
import {
  creatableName,
  libraryCount,
  matchesName,
  sortExercises,
} from './library';

const ex = (name: string, usageCount = 0): Exercise => ({
  _id: name,
  name,
  createdBy: 'coach',
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-01T10:00:00.000Z',
  usageCount,
});

const library = [
  ex('Planche'),
  ex('Kettlebell Swing', 12),
  ex('Écart facial', 2),
  ex('Corde à sauter'),
  ex('Goblet Squat', 12),
];

const names = (list: Exercise[]) => list.map((e) => e.name);

describe('l’ordre de la bibliothèque', () => {
  it('par nom, l’accent rangé avec sa lettre', () => {
    expect(names(sortExercises(library, 'name'))).toEqual([
      'Corde à sauter',
      'Écart facial',
      'Goblet Squat',
      'Kettlebell Swing',
      'Planche',
    ]);
  });

  it('les plus utilisés d’abord, les ex æquo par nom', () => {
    expect(names(sortExercises(library, 'usage'))).toEqual([
      'Goblet Squat',
      'Kettlebell Swing',
      'Écart facial',
      'Corde à sauter',
      'Planche',
    ]);
  });

  it('ne touche pas à la liste reçue', () => {
    const before = names(library);
    sortExercises(library, 'name');
    expect(names(library)).toEqual(before);
  });
});

describe('le champ du haut', () => {
  it('garde chaque mot tapé, sans accent ni casse', () => {
    expect(library.filter((e) => matchesName(e, 'corde a')).length).toBe(1);
    expect(library.filter((e) => matchesName(e, 'ECART')).length).toBe(1);
    expect(library.filter((e) => matchesName(e, '  ')).length).toBe(5);
    expect(library.filter((e) => matchesName(e, 'swing goblet')).length).toBe(
      0
    );
  });

  it('propose de créer un nom neuf, rangé', () => {
    expect(creatableName(library, '  Soulevé   de terre ')).toBe(
      'Soulevé de terre'
    );
  });

  it('ne propose pas un nom qui existe, à l’accent près', () => {
    expect(creatableName(library, 'corde a sauter')).toBeNull();
    expect(creatableName(library, 'ecart FACIAL')).toBeNull();
    expect(creatableName(library, '   ')).toBeNull();
  });
});

describe('le compte', () => {
  it('s’accorde', () => {
    expect(libraryCount(1)).toBe('1 exercice');
    expect(libraryCount(10)).toBe('10 exercices');
  });
});

/**
 * Ce que « + exercice » propose, et dans quel ordre.
 */
import { describe, expect, it } from 'vitest';
import { makeExercise } from '@/domain/fixtures';
import {
  exerciseChoices,
  IN_PROGRAM,
  LIBRARY,
  MOST_USED,
  reachLine,
  usageLine,
} from './choices';

const swing = makeExercise({
  _id: 'swing',
  name: 'Kettlebell Swing',
  usageCount: 12,
});
const oneArm = makeExercise({
  _id: 'one-arm',
  name: 'Swing à une main',
  usageCount: 0,
});
const squat = makeExercise({
  _id: 'squat',
  name: 'Goblet Squat',
  usageCount: 9,
});
const getUp = makeExercise({
  _id: 'getup',
  name: 'Turkish Get-Up',
  usageCount: 5,
});
const plank = makeExercise({ _id: 'plank', name: 'Planche', usageCount: 0 });
const library = [swing, oneArm, squat, getUp, plank];
const labels = (groups: { label: string }[]) => groups.map((g) => g.label);
const names = (group?: { exercises: { name: string }[] }) =>
  group?.exercises.map((e) => e.name);

describe('à la frappe', () => {
  // Celui qu'on a placé ailleurs dans le programme passe devant, même quand
  // un autre commence par la frappe.
  it('d’abord ce programme, puis la bibliothèque', () => {
    const { groups } = exerciseChoices('swi', library, [swing]);
    expect(labels(groups)).toEqual([IN_PROGRAM, LIBRARY]);
    expect(names(groups[0])).toEqual(['Kettlebell Swing']);
    expect(names(groups[1])).toEqual(['Swing à une main']);
  });

  it('dans un groupe, ce qui commence par la frappe passe devant', () => {
    const { groups } = exerciseChoices('s', library, []);
    expect(names(groups[0])?.[0]).toBe('Swing à une main');
  });

  it('sans accent ni capitale', () => {
    const { groups } = exerciseChoices('PLAN', library, []);
    expect(names(groups[0])).toEqual(['Planche']);
  });

  it('un nom nouveau se propose à la création', () => {
    expect(exerciseChoices('  Burpee lesté ', library, []).create).toBe(
      'Burpee lesté'
    );
  });

  // « goblet squat » ne doit pas faire un second Goblet Squat.
  it('un nom qui existe déjà ne se crée pas', () => {
    expect(exerciseChoices('goblet squat', library, []).create).toBeUndefined();
  });

  it('un groupe vide ne se montre pas', () => {
    expect(labels(exerciseChoices('plan', library, [swing]).groups)).toEqual([
      LIBRARY,
    ]);
  });
});

describe('les mouvements de ce programme', () => {
  // Un programme repeuple ses exercices sans leurs compteurs.
  it('se lisent avec les compteurs de la bibliothèque', () => {
    const placed = makeExercise({ _id: 'swing', name: 'Kettlebell Swing' });
    const { groups } = exerciseChoices('swi', library, [placed]);
    expect(groups[0].exercises[0].usageCount).toBe(12);
  });

  it('absents de la bibliothèque, ils restent tels quels', () => {
    const orphan = makeExercise({ _id: 'orphan', name: 'Swing maison' });
    const { groups } = exerciseChoices('swi', library, [orphan]);
    expect(groups[0].exercises).toEqual([orphan]);
  });
});

describe('sans frappe', () => {
  it('ce programme, les plus utilisés ailleurs, puis le reste', () => {
    const { groups, create } = exerciseChoices('', library, [swing]);
    expect(labels(groups)).toEqual([IN_PROGRAM, MOST_USED, LIBRARY]);
    expect(names(groups[1])).toEqual(['Goblet Squat', 'Turkish Get-Up']);
    expect(names(groups[2])).toEqual(['Planche', 'Swing à une main']);
    expect(create).toBeUndefined();
  });
});

describe('ce qui se lit de l’usage', () => {
  it('« 12 séances », « 1 séance », « jamais utilisé »', () => {
    expect(usageLine(swing)).toBe('12 séances');
    expect(usageLine(makeExercise({ usageCount: 1 }))).toBe('1 séance');
    expect(usageLine(plank)).toBe('jamais utilisé');
  });

  it('la fiche le dit avant qu’on la modifie', () => {
    expect(reachLine(makeExercise({ usageCount: 9, clientCount: 4 }))).toBe(
      'Utilisé dans 9 séances, chez 4 clients. Ce que tu changes ici change partout.'
    );
    expect(reachLine(makeExercise({ usageCount: 1, clientCount: 1 }))).toBe(
      'Utilisé dans 1 séance, chez 1 client. Ce que tu changes ici change partout.'
    );
    expect(reachLine(plank)).toBe('Pas encore utilisé dans une séance.');
  });
});

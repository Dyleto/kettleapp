/**
 * Les − et + de l'atelier, et ce que coûte un changement d'unité : des cas
 * qu'un écran ne construit pas, comme une durée tapée à 37 s.
 */
import { describe, expect, it } from 'vitest';
import { makeBlockExercise } from '@/domain/fixtures';
import { doseUnitOf, erasedDose, stepped, switchedDose } from './doseEdit';

const n = (text?: string) => text?.replaceAll(' ', ' ');

describe('les pas de « − » et « + »', () => {
  it('une répétition, une série à la fois', () => {
    expect(stepped('reps', 12, 1)).toBe(13);
    expect(stepped('reps', 12, -1)).toBe(11);
    expect(stepped('sets', 3, 1)).toBe(4);
  });

  it('une répétition ne descend pas sous un', () => {
    expect(stepped('reps', 1, -1)).toBe(1);
  });

  // Une seule série, c'est ce que l'API dit en n'en disant rien.
  it('ramenées à une seule, les séries s’effacent', () => {
    expect(stepped('sets', 2, -1)).toBeUndefined();
    expect(stepped('sets', undefined, 1)).toBe(2);
  });

  it('une durée avance de 5 s, puis de 15 s, puis de 30 s', () => {
    expect(stepped('duration', 30, 1)).toBe(35);
    expect(stepped('duration', 90, 1)).toBe(105);
    expect(stepped('duration', 300, 1)).toBe(330);
  });

  // Le pas d'une descente se lit sous la valeur : l'aller-retour revient
  // d'où il est parti.
  it('un aller-retour revient d’où il est parti', () => {
    expect(stepped('duration', 60, -1)).toBe(55);
    expect(stepped('duration', 55, 1)).toBe(60);
    expect(stepped('duration', 60, 1)).toBe(75);
    expect(stepped('duration', 75, -1)).toBe(60);
  });

  it('une valeur hors grille revient sur un nombre rond', () => {
    expect(stepped('duration', 37, 1)).toBe(40);
    expect(stepped('duration', 37, -1)).toBe(35);
  });

  it('une durée ne descend pas sous 5 s', () => {
    expect(stepped('duration', 5, -1)).toBe(5);
  });

  it('un repos ramené à zéro devient « aucun »', () => {
    expect(stepped('rest', 15, -1)).toBeUndefined();
    expect(stepped('rest', undefined, 1)).toBe(30);
    expect(stepped('rest', undefined, -1)).toBeUndefined();
  });

  it('une mesure libre avance à la mesure de sa valeur', () => {
    expect(stepped('custom', 500, 1)).toBe(550);
    expect(stepped('custom', 22.5, -1)).toBe(20);
    expect(stepped('custom', 3, 1)).toBe(4);
  });

  it('les tours et les minutes d’un bloc, un à un, jamais sous un', () => {
    expect(stepped('rounds', 10, 1)).toBe(11);
    expect(stepped('minutes', 1, -1)).toBe(1);
  });

  // Une limite posée sur un bloc « sans limite » part de dix, pas d'un.
  it('une limite qu’on pose part de dix', () => {
    expect(stepped('rounds', undefined, 1)).toBe(10);
    expect(stepped('minutes', undefined, 1)).toBe(10);
  });

  it('une valeur absente part du premier pas qui a un sens', () => {
    expect(stepped('reps', undefined, 1)).toBe(1);
    expect(stepped('duration', undefined, 1)).toBe(30);
    expect(stepped('reps', undefined, -1)).toBeUndefined();
  });
});

describe('changer d’unité', () => {
  it('l’unité se lit sur ce qui est rempli', () => {
    expect(doseUnitOf(makeBlockExercise({ duration: 30 }))).toBe('duration');
    expect(
      doseUnitOf(makeBlockExercise({ customMetric: { value: 1, unit: 'km' } }))
    ).toBe('custom');
    expect(doseUnitOf(makeBlockExercise({}))).toBe('reps');
  });

  // L'API refuse une ligne qui en porte deux.
  it('une seule unité à la fois : les deux autres s’effacent', () => {
    expect(switchedDose('duration')).toEqual({
      reps: undefined,
      duration: 30,
      customMetric: undefined,
    });
    expect(switchedDose('custom').customMetric).toEqual({
      value: 100,
      unit: 'm',
    });
  });

  it('ce qui s’efface, tel que la bannière le rappelle', () => {
    expect(n(erasedDose(makeBlockExercise({ reps: 12 })))).toBe('12 reps');
    expect(n(erasedDose(makeBlockExercise({ duration: 60 })))).toBe('1 min');
    expect(
      n(
        erasedDose(
          makeBlockExercise({ customMetric: { value: 500, unit: 'm' } })
        )
      )
    ).toBe('500 m');
    expect(erasedDose(makeBlockExercise({}))).toBeUndefined();
  });
});

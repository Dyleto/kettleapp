import { describe, expect, it } from 'vitest';
import { EFFORT_LEVELS, getEffortLevel, getEffortSummary } from './effort';
import { makeCompleted } from '@/domain/fixtures';

describe("l'échelle de ressenti", () => {
  it('va du plus facile au plus dur, dans le sens des valeurs enregistrées', () => {
    // C'est l'ordre que le client touche et que le coach lit. Le renverser à
    // l'affichage a déjà fait lire la même réponse dans deux sens.
    expect(EFFORT_LEVELS.map((level) => level.label)).toEqual([
      'Trop facile',
      'Facile',
      'Juste',
      'Dure',
      'Trop dure',
    ]);
  });

  it('garde les valeurs que portent les bilans déjà enregistrés', () => {
    // Aucune migration ne réécrit l'historique : 1 doit rester « Trop
    // facile » et 5 « Trop dure », quoi que devienne l'affichage.
    expect(EFFORT_LEVELS.map((level) => level.value)).toEqual([1, 2, 3, 4, 5]);
    expect(getEffortLevel(1)?.label).toBe('Trop facile');
    expect(getEffortLevel(5)?.label).toBe('Trop dure');
  });

  it('place la cible au milieu, seule de sa zone', () => {
    expect(EFFORT_LEVELS.map((level) => level.zone)).toEqual([
      'easy',
      'easy',
      'target',
      'hard',
      'hard',
    ]);
  });

  it('ne rend aucun cran pour un bilan sans ressenti', () => {
    // Une absence de réponse n'est pas un « Juste ».
    expect(getEffortLevel(undefined)).toBeUndefined();
    expect(getEffortLevel(0)).toBeUndefined();
  });
});

describe('le cran d’effort d’un bilan', () => {
  it('rend le cran que le client a choisi', () => {
    expect(
      getEffortSummary(makeCompleted({ feedback: { effort: 3 } }))?.label
    ).toBe('Juste');
  });

  it('rien sur un bilan d’avant la refonte de l’échelle', () => {
    // La question ne lui a jamais été posée : on n'invente pas de réponse, et
    // surtout pas un « Juste » par défaut, qui se lirait comme un ressenti.
    expect(getEffortSummary(makeCompleted())).toBeNull();
  });

  it('rien non plus sur un cran hors échelle', () => {
    expect(
      getEffortSummary(makeCompleted({ feedback: { effort: 9 } }))
    ).toBeNull();
  });
});

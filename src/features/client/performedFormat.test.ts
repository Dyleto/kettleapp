/**
 * Comment une série notée se relit.
 *
 * Le travail d'abord, la charge ensuite — « 12 reps · 26 kg », l'ordre dans
 * lequel on le dit à voix haute. Retour du terrain : « c'est plus naturel de
 * mettre 9 × 12 kg plutôt que 12 kg × 9 ».
 *
 * Ces formes cassent en silence : rien ne plante quand « 3 × 26 kg » se met à
 * vouloir dire trois répétitions au lieu de trois séries. Cela dit simplement
 * quelque chose de faux, sans bruit.
 *
 * Ce fichier remplace `verif/verify_format.mjs`, qui empaquetait ce module
 * avec esbuild pour l'éprouver depuis le banc — faute d'un lanceur de tests.
 * Il y en a un maintenant. Le banc n'a plus de suite qui n'ouvre pas de
 * navigateur, et il ne dépend plus d'esbuild, qu'il n'avait d'ailleurs jamais
 * déclaré.
 */
import { describe, expect, it } from 'vitest';
import {
  formatPerformed,
  formatPerformedSets,
  isEmptySet,
  sameSet,
} from './performedFormat';

describe('les quatre formes', () => {
  it('une série', () => {
    expect(formatPerformedSets([{ weight: 26, reps: 12 }])).toBe(
      '12 reps · 26 kg'
    );
  });

  it('plusieurs séries identiques : le compte mène le travail', () => {
    expect(
      formatPerformedSets([
        { weight: 26, reps: 12 },
        { weight: 26, reps: 12 },
        { weight: 26, reps: 12 },
      ])
    ).toBe('3 × 12 reps · 26 kg');
  });

  it('même charge, moins de reps à chaque fois', () => {
    expect(
      formatPerformedSets([
        { weight: 26, reps: 12 },
        { weight: 26, reps: 10 },
        { weight: 26, reps: 8 },
      ])
    ).toBe('12 + 10 + 8 reps · 26 kg');
  });

  it('tout le reste, série par série', () => {
    expect(
      formatPerformedSets([
        { weight: 26, reps: 12 },
        { weight: 24, reps: 10 },
      ])
    ).toBe('12 × 26 kg · 10 × 24 kg');
  });
});

describe('un nombre avant une charge veut toujours dire des reps', () => {
  // C'est ce que paie le mot « reps ». Un compte de séries à cette place doit
  // nommer sa propre unité, sans quoi « 3 × 26 kg » annonce trois répétitions
  // à 26 kg quand trois séries ont été faites.
  it('une charge tenue, une série', () => {
    expect(formatPerformedSets([{ weight: 26 }])).toBe('26 kg');
  });

  it('la même charge sur trois séries dit « séries »', () => {
    expect(
      formatPerformedSets([{ weight: 26 }, { weight: 26 }, { weight: 26 }])
    ).toBe('3 séries · 26 kg');
  });

  it('et trois séries de douze reste un compte de séries', () => {
    expect(
      formatPerformedSets([
        { weight: 26, reps: 12 },
        { weight: 26, reps: 12 },
        { weight: 26, reps: 12 },
      ])
    ).toBe('3 × 12 reps · 26 kg');
  });
});

describe('ce qui n’a pas été noté ne s’invente pas', () => {
  it('des reps sans charge', () => {
    expect(formatPerformedSets([{ reps: 12 }])).toBe('12 reps');
  });

  it('sur trois séries', () => {
    expect(
      formatPerformedSets([{ reps: 12 }, { reps: 12 }, { reps: 12 }])
    ).toBe('3 × 12 reps');
  });

  it('un exercice chronométré', () => {
    expect(formatPerformedSets([{ duration: 45, weight: 16 }])).toBe(
      '45s · 16 kg'
    );
  });

  it('chronométré, sans charge', () => {
    expect(
      formatPerformedSets([
        { duration: 45 },
        { duration: 45 },
        { duration: 45 },
      ])
    ).toBe('3 × 45s');
  });

  it('rien du tout', () => {
    expect(formatPerformedSets([])).toBeNull();
  });

  it('une série vide ne dit rien non plus', () => {
    expect(formatPerformedSets([{}])).toBeNull();
  });

  it('un zéro se dit, lui : ce n’est pas une absence', () => {
    expect(formatPerformedSets([{ weight: 0, reps: 10 }])).toBe(
      '10 reps · 0 kg'
    );
  });
});

describe('une série vide arrête là l’exercice', () => {
  it('ce qui suit une série vide n’a pas eu lieu', () => {
    expect(
      formatPerformedSets([
        { weight: 26, reps: 12 },
        {},
        { weight: 99, reps: 99 },
      ])
    ).toBe('12 reps · 26 kg');
  });

  it('un nombre de reps manquant dans une série reste ouvert', () => {
    // La série existe — elle porte une charge — mais on ne sait pas combien de
    // fois. Le tiret dit cela, là où l'omettre dirait « une seule série ».
    expect(
      formatPerformedSets([{ weight: 26, reps: 12 }, { weight: 26 }])
    ).toBe('12 + — reps · 26 kg');
  });

  it('une première série vide ne laisse rien', () => {
    expect(formatPerformedSets([{}, { weight: 26, reps: 12 }])).toBeNull();
  });
});

describe('les deux aides', () => {
  it('une série vide n’a ni charge, ni reps, ni durée', () => {
    expect(isEmptySet({})).toBe(true);
    expect(isEmptySet({ weight: 26 })).toBe(false);
    expect(isEmptySet({ reps: 10 })).toBe(false);
    expect(isEmptySet({ duration: 45 })).toBe(false);
  });

  it('un zéro n’est pas une absence', () => {
    expect(isEmptySet({ weight: 0 })).toBe(false);
    expect(isEmptySet({ reps: 0 })).toBe(false);
  });

  it('deux séries sont identiques champ à champ', () => {
    expect(sameSet({ weight: 26, reps: 12 }, { weight: 26, reps: 12 })).toBe(
      true
    );
    expect(sameSet({ weight: 26, reps: 12 }, { weight: 26, reps: 10 })).toBe(
      false
    );
    expect(sameSet({ weight: 26 }, { weight: 26, reps: 12 })).toBe(false);
  });
});

describe('ce que l’enveloppe rend', () => {
  it('lit les séries de ce qui a été réalisé', () => {
    expect(formatPerformed({ sets: [{ weight: 26, reps: 12 }] })).toBe(
      '12 reps · 26 kg'
    );
  });

  it('rend `null` quand rien n’a été réalisé', () => {
    expect(formatPerformed(undefined)).toBeNull();
  });
});

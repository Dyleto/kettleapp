import { describe, expect, it } from 'vitest';
import {
  loadLegend,
  proposedLoad,
  repsLegend,
  stepLoad,
  stepReps,
} from './load';
import { formatWeight, heaviest } from '@/domain/history/load';

const loads = (...weights: (number | undefined)[]) =>
  weights.map((weight) => (weight === undefined ? {} : { weight }));

describe('heaviest', () => {
  it('garde la série la plus lourde', () => {
    expect(heaviest(loads(24, 26, 24))).toBe(26);
  });

  it('ignore les séries sans charge et les charges nulles', () => {
    expect(heaviest(loads(undefined, 0, 20))).toBe(20);
    expect(heaviest(loads(undefined))).toBeUndefined();
    expect(heaviest(undefined)).toBeUndefined();
  });
});

describe('proposedLoad', () => {
  it('rend ce qui est déjà noté pour cette série', () => {
    expect(proposedLoad(loads(24, 28), 2, loads(20))).toBe(28);
  });

  it('reprend la dernière charge notée plus tôt dans la séance', () => {
    // Trois séries à 26 : la quatrième est proposée à 26, pas à la charge de
    // la semaine dernière.
    expect(proposedLoad(loads(24, 26, 26), 4, loads(22))).toBe(26);
  });

  it('ne regarde pas les séries d’après', () => {
    // Une série rouverte plus haut ne se voit pas proposer ce qu'on a mis
    // plus loin.
    expect(proposedLoad(loads(undefined, undefined, 30), 2, loads(22))).toBe(
      22
    );
  });

  it('retombe sur la plus lourde série de la dernière fois', () => {
    expect(proposedLoad(undefined, 1, loads(24, 26))).toBe(26);
  });

  it('ne propose rien quand personne n’a jamais rien noté', () => {
    expect(proposedLoad(undefined, 1, undefined)).toBeUndefined();
    expect(proposedLoad(loads(undefined), 2, loads(undefined))).toBeUndefined();
  });
});

describe('loadLegend', () => {
  it('dit « comme la dernière fois » à charge égale', () => {
    expect(loadLegend(26, loads(24, 26))).toBe('comme la dernière fois');
  });

  it('dit l’écart, au demi-kilo et à la virgule', () => {
    expect(loadLegend(28, loads(26))).toBe('+ 2 kg sur la dernière fois');
    expect(loadLegend(22.5, loads(20))).toBe('+ 2,5 kg sur la dernière fois');
    expect(loadLegend(24, loads(26))).toBe('2 kg de moins');
  });

  it('se tait sans dernière fois, ou sans charge', () => {
    expect(loadLegend(26, undefined)).toBeUndefined();
    expect(loadLegend(undefined, loads(26))).toBeUndefined();
  });
});

describe('stepLoad', () => {
  it('monte et descend d’un pas', () => {
    expect(stepLoad(26, 1)).toBe(27);
    expect(stepLoad(26, -1)).toBe(25);
    expect(stepLoad(26, 5)).toBe(31);
  });

  it('se cale au demi-kilo', () => {
    expect(stepLoad(22.5, 1)).toBe(23.5);
    expect(stepLoad(22.3, 0)).toBe(22.5);
  });

  it('part de rien vers le haut, et ne descend pas sous rien', () => {
    expect(stepLoad(undefined, 1)).toBe(1);
    expect(stepLoad(undefined, -1)).toBeUndefined();
  });

  it('s’efface plutôt que d’écrire zéro kilo', () => {
    expect(stepLoad(1, -1)).toBeUndefined();
    expect(stepLoad(3, -5)).toBeUndefined();
  });
});

describe('formatWeight', () => {
  it('écrit les décimales à la française', () => {
    expect(formatWeight(22.5)).toBe('22,5');
    expect(formatWeight(26)).toBe('26');
  });
});

describe('stepReps', () => {
  it('part du prescrit quand rien n’est noté', () => {
    expect(stepReps(undefined, -1, 10)).toBe(9);
    expect(stepReps(undefined, 1, 10)).toBe(11);
  });

  it('part de ce qui est noté sinon', () => {
    expect(stepReps(7, -1, 10)).toBe(6);
  });

  it('zéro est un nombre, et l’on ne descend pas en dessous', () => {
    expect(stepReps(1, -1, 10)).toBe(0);
    expect(stepReps(0, -5, 10)).toBe(0);
  });
});

describe('repsLegend', () => {
  it('compare au prescrit', () => {
    expect(repsLegend(undefined, 10)).toBe('comme prescrit');
    expect(repsLegend(10, 10)).toBe('comme prescrit');
    expect(repsLegend(12, 10)).toBe('2 de plus que prescrit');
    expect(repsLegend(8, 10)).toBe('2 de moins que prescrit');
  });
});

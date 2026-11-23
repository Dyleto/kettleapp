import { describe, expect, it } from 'vitest';
import { PULL_ARM, pullIntent, pullPhase, pullTravel } from './pull';

describe('pullTravel', () => {
  it('suit le doigt à moitié', () => {
    expect(pullTravel(40)).toBe(20);
    expect(pullTravel(128)).toBe(PULL_ARM);
  });

  it('s’arrête à 96 px, quelle que soit la traction', () => {
    expect(pullTravel(400)).toBe(96);
  });

  it('un doigt qui remonte ne tire rien', () => {
    expect(pullTravel(0)).toBe(0);
    expect(pullTravel(-30)).toBe(0);
  });
});

describe('pullPhase', () => {
  it('tire, puis se prépare à recharger au seuil', () => {
    expect(pullPhase(0, true)).toBe('idle');
    expect(pullPhase(PULL_ARM - 1, true)).toBe('pulling');
    expect(pullPhase(PULL_ARM, true)).toBe('armed');
  });

  it('hors connexion, le dit dès la traction et ne se prépare jamais', () => {
    expect(pullPhase(10, false)).toBe('offline');
    expect(pullPhase(96, false)).toBe('offline');
    expect(pullPhase(0, false)).toBe('idle');
  });
});

describe('pullIntent', () => {
  it('ne décide rien tant que le doigt n’a pas bougé de quelques pixels', () => {
    expect(pullIntent(3, 5)).toBe('undecided');
  });

  it('vers le bas : une traction', () => {
    expect(pullIntent(2, 20)).toBe('pull');
  });

  it('de côté, c’est le glisser d’une ligne', () => {
    expect(pullIntent(-30, 12)).toBe('other');
  });

  it('vers le haut, c’est un défilement', () => {
    expect(pullIntent(0, -20)).toBe('other');
  });
});

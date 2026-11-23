/** « Mon compte » : les dates, le partage, la ligne d'un coach, la suppression. */
import { describe, expect, it } from 'vitest';
import {
  coachLine,
  containedLine,
  deleteConsequences,
  fullDay,
  sharedWith,
} from './summary';

const julie = {
  firstName: 'Julie',
  lastName: 'Martin',
  linkedAt: '2026-06-01T10:00:00.000Z',
};
const marc = {
  firstName: 'Marc',
  lastName: 'Petit',
  linkedAt: '2026-09-14T10:00:00.000Z',
};
const client = (coaches = [julie], completedCount = 6) => ({
  coaches,
  completedCount,
  healthDataCount: 5,
  healthConsent: null,
  since: '2026-06-01T10:00:00.000Z',
});

describe('une date en toutes lettres', () => {
  it('le premier du mois en ordinal, les autres jours en chiffres', () => {
    expect(fullDay('2026-06-01T10:00:00.000Z')).toBe('1er juin 2026');
    expect(fullDay('2026-09-14T10:00:00.000Z')).toBe('14 septembre 2026');
  });
});

describe('avec qui les données de santé sont partagées', () => {
  it('le prénom d’un seul coach, « tes coachs » à plusieurs', () => {
    expect(sharedWith([julie])).toBe('Julie');
    expect(sharedWith([julie, marc])).toBe('tes coachs');
  });

  it('« ton coach » sans prénom, ou sans coach', () => {
    expect(sharedWith([{ ...julie, firstName: ' ' }])).toBe('ton coach');
    expect(sharedWith([])).toBe('ton coach');
  });
});

describe('la ligne d’un coach', () => {
  it('depuis quand, et combien de séances, s’il est seul', () => {
    expect(coachLine(julie, 6, 1)).toBe(
      'depuis le 1er juin 2026 · 6 séances faites'
    );
    expect(coachLine(julie, 1, 1)).toBe(
      'depuis le 1er juin 2026 · 1 séance faite'
    );
    expect(coachLine(julie, 0, 1)).toBe(
      'depuis le 1er juin 2026 · aucune séance faite'
    );
  });

  it('à deux coachs, la date seule : le compte ne dirait pas chez lequel', () => {
    expect(coachLine(marc, 6, 2)).toBe('depuis le 14 septembre 2026');
  });
});

describe('les séances qui contiennent des données de santé', () => {
  it('au singulier à un, rien à zéro', () => {
    expect(containedLine(5)).toBe('5 séances en contiennent.');
    expect(containedLine(1)).toBe('1 séance en contient.');
    expect(containedLine(0)).toBe('');
  });
});

describe('ce qu’une suppression efface', () => {
  it('pour un client : ses séances, son coach, ses données de santé', () => {
    expect(deleteConsequences({ asClient: client(), asCoach: null })).toEqual([
      'tes 6 séances faites et tes charges',
      'ton rattachement à Julie',
      'tes données de santé',
    ]);
  });

  it('un client sans séance perd son programme, deux coachs sont nommés', () => {
    expect(
      deleteConsequences({ asClient: client([julie, marc], 0), asCoach: null })
    ).toEqual([
      'ton programme',
      'ton rattachement à Julie et Marc',
      'tes données de santé',
    ]);
  });

  it('pour un coach : ses exercices, et le lien avec ses clients', () => {
    expect(
      deleteConsequences({
        asClient: null,
        asCoach: { clientCount: 1, since: '2026-06-01T10:00:00.000Z' },
      })
    ).toEqual([
      'tes exercices et tes modèles',
      'le lien avec ton client, à qui ses séances restent',
    ]);
  });
});

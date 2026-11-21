/**
 * Les étiquettes : leur clé, leur couleur, ce qu'une ligne en montre, ce
 * que le champ propose, ce que la barre filtre.
 */
import { describe, expect, it } from 'vitest';
import type { Client, Tag } from '@/shared/types';
import {
  canCreateTag,
  hasAnyTag,
  matchingTags,
  tagKey,
  tagTone,
  tagUsage,
  visibleTags,
} from './tags';

const TAGS: Tag[] = [
  { _id: 't1', name: 'Compétition' },
  { _id: 't2', name: 'Prise de masse' },
  { _id: 't3', name: 'Reprise' },
  { _id: 't4', name: 'Senior' },
  { _id: 't5', name: 'Sèche' },
];

const client = (tagIds: string[]): Client => ({
  _id: 'c',
  unseenCount: 0,
  linkedAt: '2026-06-01T10:00:00.000Z',
  tagIds,
  weekDone: 0,
  weekTarget: 0,
  sessionCount: 0,
  recentEfforts: [],
});

describe('la clé', () => {
  it('sans accent, sans casse, sans espaces en trop — celle de l’API', () => {
    expect(tagKey('  Prise   de MASSE ')).toBe('prise de masse');
    expect(tagKey('Compétition')).toBe('competition');
  });
});

describe('la couleur', () => {
  // La même étiquette a toujours la même, d'une visite à l'autre.
  it('se tire du nom : la même étiquette, la même teinte', () => {
    expect(tagTone('Reprise')).toBe(tagTone('reprise'));
    expect(tagTone('Compétition')).toBe(tagTone('COMPETITION'));
  });

  it('les six teintes servent', () => {
    const names = Array.from({ length: 60 }, (_, i) => `Groupe ${i}`);
    expect(new Set(names.map(tagTone)).size).toBe(6);
  });
});

describe('ce qu’une ligne montre', () => {
  it('trois au plus, dans l’ordre du coach, puis combien il en reste', () => {
    const { shown, more } = visibleTags(['t5', 't1', 't3', 't2', 't4'], TAGS);
    expect(shown.map((t) => t.name)).toEqual([
      'Compétition',
      'Prise de masse',
      'Reprise',
    ]);
    expect(more).toBe(2);
  });

  // Une étiquette supprimée ailleurs ne laisse pas de pastille vide.
  it('un identifiant inconnu est ignoré', () => {
    expect(visibleTags(['disparue', 't3'], TAGS)).toEqual({
      shown: [TAGS[2]],
      more: 0,
    });
  });
});

describe('le champ de la feuille', () => {
  it('filtre à la frappe, sans accent ni casse', () => {
    expect(matchingTags(TAGS, 'se').map((t) => t.name)).toEqual([
      'Senior',
      'Sèche',
    ]);
    expect(matchingTags(TAGS, 'COMPÉ').map((t) => t.name)).toEqual([
      'Compétition',
    ]);
  });

  it('rien tapé : toutes', () => {
    expect(matchingTags(TAGS, '')).toHaveLength(5);
  });

  it('« Créer » n’apparaît que pour un nom neuf, ni vide ni trop long', () => {
    expect(canCreateTag(TAGS, 'Sen')).toBe(true);
    expect(canCreateTag(TAGS, 'reprise')).toBe(false);
    expect(canCreateTag(TAGS, 'competition')).toBe(false);
    expect(canCreateTag(TAGS, '   ')).toBe(false);
    expect(canCreateTag(TAGS, 'x'.repeat(25))).toBe(false);
  });
});

describe('la barre de filtre', () => {
  it('sans étiquette choisie : tout le monde', () => {
    expect(hasAnyTag(client([]), new Set())).toBe(true);
  });

  it('plusieurs choisies : ceux qui en portent au moins une', () => {
    const chosen = new Set(['t1', 't3']);
    expect(hasAnyTag(client(['t3']), chosen)).toBe(true);
    expect(hasAnyTag(client(['t2']), chosen)).toBe(false);
  });

  it('combien de clients une suppression touchera', () => {
    expect(
      tagUsage([client(['t1']), client(['t1', 't2']), client([])], 't1')
    ).toBe(2);
  });
});

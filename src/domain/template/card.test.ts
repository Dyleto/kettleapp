/** La carte d'un modèle : sa ligne de repères, ses séances, ce qui reste. */
import { describe, expect, it } from 'vitest';
import type { TemplateRow } from '@/shared/types';
import { moreSessions, previewLabel, templateMeta } from './card';

const row = (overrides: Partial<TemplateRow> = {}): TemplateRow => ({
  _id: 'tpl',
  name: 'Prise de masse',
  sessionCount: 2,
  usageCount: 3,
  preview: [
    { _id: 's1', order: 1, name: 'Full body A', blockTypes: ['warmup'] },
    { _id: 's2', order: 2, blockTypes: [] },
  ],
  updatedAt: '2026-11-01T10:00:00.000Z',
  ...overrides,
});

describe('les repères d’un modèle', () => {
  it('ses séances et chez combien de clients il a servi', () => {
    expect(templateMeta(row())).toBe('2 séances · utilisé chez 3 clients');
    expect(templateMeta(row({ sessionCount: 1, usageCount: 1 }))).toBe(
      '1 séance · utilisé chez 1 client'
    );
  });

  it('vide, jamais utilisé', () => {
    expect(
      templateMeta(row({ sessionCount: 0, usageCount: 0, preview: [] }))
    ).toBe('vide · jamais utilisé');
  });
});

describe('les séances de la carte', () => {
  it('le rang et le nom ; sans nom, « Séance 2 »', () => {
    const [first, second] = row().preview;
    expect(previewLabel(first)).toBe('1 · Full body A');
    expect(previewLabel(second)).toBe('2 · Séance 2');
  });

  it('au-delà de quatre, combien il en reste', () => {
    const preview = [1, 2, 3, 4].map((order) => ({
      _id: `s${order}`,
      order,
      blockTypes: [],
    }));
    expect(moreSessions(row({ sessionCount: 6, preview }))).toBe('+ 2 séances');
    expect(moreSessions(row({ sessionCount: 5, preview }))).toBe('+ 1 séance');
    expect(moreSessions(row())).toBeNull();
  });
});

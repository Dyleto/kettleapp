/**
 * Le compteur d'un onglet : ce qu'il affiche, et quand il se tait.
 */
import { describe, expect, it } from 'vitest';
import { countLabel } from './count';

describe('le compteur d’un onglet', () => {
  it('rien à zéro, rien sans valeur', () => {
    expect(countLabel(0)).toBeNull();
    expect(countLabel(undefined)).toBeNull();
  });

  it('le nombre, tel quel, jusqu’à 99', () => {
    expect(countLabel(1)).toBe('1');
    expect(countLabel(99)).toBe('99');
  });

  // La pastille tient dans un cercle : trois chiffres la feraient déborder.
  it('« 99+ » au-delà', () => {
    expect(countLabel(100)).toBe('99+');
    expect(countLabel(240)).toBe('99+');
  });

  // Une valeur qui ne peut pas être un compte ne s'affiche pas plutôt que
  // d'afficher « NaN » ou « -3 ».
  it('une valeur impossible se tait', () => {
    expect(countLabel(-3)).toBeNull();
    expect(countLabel(Number.NaN)).toBeNull();
  });
});

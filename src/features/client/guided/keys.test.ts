/**
 * Les raccourcis de la séance guidée : quelle touche demande quoi, et quand
 * elle se tait. Le banc mène les touches dans la séance elle-même ; ici, les
 * cas qui tiennent en une ligne.
 */
import { describe, expect, it } from 'vitest';
import { guidedKey } from './keys';

const key = (k: string, mods: Partial<KeyboardEvent> = {}) => ({
  key: k,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...mods,
});
const page = { tagName: 'DIV' };

describe('guidedKey', () => {
  it('Espace valide, P met en pause, les flèches reculent et avancent', () => {
    expect(guidedKey(key(' '), page)).toBe('primary');
    expect(guidedKey(key('p'), page)).toBe('pause');
    expect(guidedKey(key('P'), page)).toBe('pause');
    expect(guidedKey(key('ArrowLeft'), page)).toBe('previous');
    expect(guidedKey(key('ArrowRight'), page)).toBe('next');
  });

  it('les autres touches ne demandent rien', () => {
    expect(guidedKey(key('a'), page)).toBeNull();
    expect(guidedKey(key('Enter'), page)).toBeNull();
  });

  it('un champ garde ses touches', () => {
    expect(guidedKey(key(' '), { tagName: 'INPUT' })).toBeNull();
    expect(guidedKey(key('p'), { tagName: 'TEXTAREA' })).toBeNull();
    expect(guidedKey(key('ArrowLeft'), { isContentEditable: true })).toBeNull();
  });

  it('Espace sur un bouton : le bouton y répond déjà', () => {
    expect(guidedKey(key(' '), { tagName: 'BUTTON' })).toBeNull();
    // Mais P et les flèches restent des raccourcis.
    expect(guidedKey(key('p'), { tagName: 'BUTTON' })).toBe('pause');
  });

  it('avec un modificateur, c’est au navigateur', () => {
    expect(guidedKey(key('p', { ctrlKey: true }), page)).toBeNull();
    expect(guidedKey(key('ArrowLeft', { altKey: true }), page)).toBeNull();
    expect(guidedKey(key(' ', { metaKey: true }), page)).toBeNull();
  });
});

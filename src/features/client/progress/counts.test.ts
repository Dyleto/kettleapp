/**
 * Le total du journal, et son pluriel.
 *
 * Une fonction d'une ligne, mais qui écrit une phrase lue à chaque ouverture
 * de l'historique — et dont les trois cas de pluriel se décident sur une
 * comparaison, `> 1`, qu'un `>= 1` ou un `> 0` casserait sans qu'aucun écran
 * ne le montre à une séance près.
 */
import { describe, expect, it } from 'vitest';
import { lifetimeTotal } from './counts';

describe('« 12 séances faites depuis le début »', () => {
  it('se met au pluriel à partir de deux', () => {
    expect(lifetimeTotal(12)).toBe('12 séances faites depuis le début');
  });

  it('reste au singulier à une', () => {
    expect(lifetimeTotal(1)).toBe('1 séance faite depuis le début');
  });

  it('et au singulier à zéro, comme le veut le français', () => {
    // « 0 séances » est une faute : en français le pluriel commence à deux.
    // L'écran ne montre pas ce cas — l'historique vide affiche autre chose —
    // mais la phrase doit être juste quand il y passe.
    expect(lifetimeTotal(0)).toBe('0 séance faite depuis le début');
  });

  it('nomme ce qu’elle couvre', () => {
    // « depuis le début » n'est pas décoratif. Deux écrans affichaient un
    // nombre de séances faites avec le même mot et deux sens différents, et
    // dès la deuxième semaine de programme les deux divergeaient pour tout le
    // monde : un client qui lit « 3 » puis « 12 » en conclut qu'un des deux
    // écrans ment.
    expect(lifetimeTotal(3)).toContain('depuis le début');
  });
});

/**
 * Le décompte qui survit à l'écran éteint.
 *
 * Ce qui est vérifié ici est `secondsLeft`, et c'est volontairement tout : le
 * reste de `useCountdown` est du câblage React — poser l'échéance au premier
 * démarrage, battre toutes les 250 ms, rendre `pause` / `resume` / `skip` —
 * et aucun test unitaire ne monte de composant.
 *
 * Ce que le banc couvre déjà (`verif/verify_chrono.mjs`) : l'horloge attend
 * qu'on la lance, trois secondes d'attente ne mordent pas sur le tour, une
 * touche la lance, elle tourne, et les tours suivants d'un EMOM partent
 * seuls.
 *
 * Ce que ni l'un ni l'autre ne couvre, et il vaut mieux l'écrire que le
 * laisser croire : l'onglet réellement mis en arrière-plan. C'est le défaut
 * d'origine — des minuteurs ralentis, donc plusieurs secondes de retard par
 * tour — et un navigateur piloté ne ralentit pas ses minuteurs sur commande.
 * Ce qui est vérifiable, c'est que le temps se lit sur une échéance et non
 * sur un compteur qu'on décrémente : un tick manqué ne peut alors rien
 * coûter, puisque personne ne compte les ticks.
 *
 * Et une chose de plus, mesurée : que le hook appelle bien `secondsLeft` ne
 * se vérifie nulle part. Remplacer cet appel par un `Math.round` fait à la
 * main dans le battement ne fait tomber aucune assertion d'ici — c'est du
 * câblage — ni aucune du banc, qui lit « 5x s restant » et accepterait donc
 * une seconde d'écart. Écrit pour que personne ne le croie couvert.
 */
import { describe, expect, it } from 'vitest';
import { secondsLeft } from './useCountdown';

/** Une horloge arbitraire, mais fixe : les écarts seuls comptent. */
const T0 = 1_800_000_000_000;

describe('les secondes qui restent', () => {
  it('se lisent sur l’écart à l’échéance', () => {
    expect(secondsLeft(T0 + 60_000, T0)).toBe(60);
  });

  it('ne descendent jamais sous zéro', () => {
    // Une échéance dépassée — l'onglet est resté en arrière-plan deux
    // minutes — rend zéro, pas un nombre négatif qui s'afficherait « -117 ».
    expect(secondsLeft(T0, T0 + 117_000)).toBe(0);
  });

  it('valent zéro pile à l’échéance', () => {
    expect(secondsLeft(T0, T0)).toBe(0);
  });
});

describe('une seconde entamée se lit encore', () => {
  it('au départ : 59,75 s restent « 60 »', () => {
    // Le premier battement tombe 250 ms après le lancement. Arrondi vers le
    // bas, l'horloge afficherait « 0:59 » un quart de seconde après qu'on
    // l'a lancée — un tour d'une minute n'aurait jamais l'air d'en durer
    // une.
    expect(secondsLeft(T0 + 60_000, T0 + 250)).toBe(60);
  });

  it('à l’arrivée : 300 ms restent « 1 »', () => {
    // L'autre bout de la même règle : tant que la dernière seconde n'est pas
    // écoulée, il en reste une. C'est ce qui empêche la fin de se déclencher
    // en avance — le passage à zéro appelle `onComplete`.
    expect(secondsLeft(T0 + 300, T0)).toBe(1);
  });

  it('et 1 ms aussi', () => {
    expect(secondsLeft(T0 + 1, T0)).toBe(1);
  });
});

describe('un tick manqué ne coûte rien', () => {
  it('parce que personne ne compte les ticks', () => {
    // C'est le défaut que ce module répare. Un décompte qui soustrait une
    // seconde par battement perd ce que les battements perdent : l'onglet
    // passe en arrière-plan, le navigateur ralentit ses minuteurs, et le
    // chrono prend du retard. Lu sur une échéance, le temps écoulé est le
    // même qu'on ait battu quarante fois ou deux.
    const echeance = T0 + 60_000;
    const lectures = [0, 250, 500, 30_000, 59_000].map((d) =>
      secondsLeft(echeance, T0 + d)
    );
    expect(lectures).toEqual([60, 60, 60, 30, 1]);
  });

  it('et une reprise après pause repart de ce qui restait', () => {
    // `resume` repose l'échéance à `maintenant + restant`. Les secondes
    // passées en pause ne doivent donc rien enlever : c'est la même garantie,
    // vue depuis la commande.
    const restant = 42;
    const reprisA = T0 + 9_000;
    expect(secondsLeft(reprisA + restant * 1000, reprisA)).toBe(42);
  });
});

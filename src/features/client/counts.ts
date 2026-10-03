/**
 * Compter des séances, et dire ce qu'on compte.
 *
 * Deux écrans affichaient un nombre de séances faites, avec le même mot et
 * deux sens différents : « Mon programme » comptait combien des séances du
 * programme avaient été faites au moins une fois, « Mon journal » comptait des
 * occurrences. Un programme se répète chaque semaine : dès la deuxième, les
 * deux nombres divergent pour tout le monde, et un client qui lit « 3 » puis
 * « 12 » en conclut qu'un des deux écrans ment.
 *
 * La proportion du programme a disparu — elle répondait à une question que
 * personne ne posait, et elle se fondait sur un identifiant qui survit à une
 * modification, si bien qu'elle pouvait annoncer « 7 séances sur 2 déjà
 * faites » dès que le coach avait remanié le programme. Chaque séance dit
 * maintenant quand elle a été faite pour la dernière fois. Il ne reste que le
 * total courant, et il nomme ce qu'il couvre.
 */

/** « 12 séances faites depuis le début » — le total courant du journal. */
export const lifetimeTotal = (completions: number): string =>
  `${completions} séance${completions > 1 ? 's' : ''} faite${
    completions > 1 ? 's' : ''
  } depuis le début`;

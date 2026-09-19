/**
 * Compter les séances, et dire ce qu'on compte.
 *
 * Deux écrans affichaient un nombre de séances faites, avec le même mot et
 * deux sens différents :
 *
 *   « Mon programme »  →  « 3 complétées »   — trois séances du programme
 *                                               ont été faites au moins une
 *                                               fois (ce sont les trois
 *                                               cartes marquées « Terminée »)
 *   « Mon journal »    →  « 12 séances complétées » — douze réalisations
 *
 * Aucun des deux n'était faux, et l'écart n'est pas un cas limite : un
 * programme se répète chaque semaine, donc dès la deuxième semaine les deux
 * nombres divergent pour tout le monde. Un client qui lit « 3 » puis « 12 »
 * conclut qu'un des deux écrans ment.
 *
 * Les deux phrases vivent donc ici, l'une à côté de l'autre, et chacune dit
 * sur quoi elle porte : une proportion du programme d'un côté, un cumul
 * depuis le début de l'autre. Une proportion ne peut pas se lire comme un
 * total — c'est ce qui empêche la confusion de revenir.
 */

/** « 3 séances sur 5 déjà faites » — la couverture du programme. */
export const avancementProgramme = (faites: number, total: number): string => {
  if (faites === 0) {
    return `${total} séance${total > 1 ? 's' : ''} · aucune encore faite`;
  }
  return `${faites} séance${faites > 1 ? 's' : ''} sur ${total} déjà faite${
    faites > 1 ? 's' : ''
  }`;
};

/** « 12 séances faites depuis le début » — le cumul du journal. */
export const cumulRealisations = (realisations: number): string =>
  `${realisations} séance${realisations > 1 ? 's' : ''} faite${
    realisations > 1 ? 's' : ''
  } depuis le début`;

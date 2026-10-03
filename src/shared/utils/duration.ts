/**
 * Comment s'écrivent les durées, à une seule adresse.
 *
 * Ce module n'importe rien, et c'est tout l'enjeu : `utils/formatters` a
 * besoin des constantes de bloc, et les constantes de bloc ont besoin
 * d'écrire des durées. Loger la règle dans l'un ou l'autre créait un cycle —
 * et un cycle ici se serait terminé par une seconde copie de la règle.
 */

/**
 * Une durée prescrite, dans l'unique convention de l'application.
 *
 * Quatre écritures existaient pour la même quantité — « 2min », « 1min »,
 * « 120 s », « 119s » — dont deux sur le même écran. Le coach ne pouvait pas
 * se fier à ce qu'il lisait pour savoir ce que son client lirait.
 *
 * La règle : sous la minute, des secondes nues ; au-dessus, des minutes, et
 * la seconde restante seulement quand il y en a une. Toujours une espace
 * insécable avant l'unité — « 45 » et « s » ne se séparent pas en fin de
 * ligne, et un nombre collé à sa lettre se lit comme un mot.
 */
const NBSP = '\u00A0';

/** Écrit une durée selon la règle ci-dessus. Le seul endroit qui le fasse :
 * un second formateur, c'est une cinquième écriture. */
export const formatDuration = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total}${NBSP}s`;

  const minutes = Math.floor(total / 60);
  const rest = total % 60;

  if (minutes < 60) {
    return rest === 0
      ? `${minutes}${NBSP}min`
      : `${minutes}${NBSP}min${NBSP}${rest}${NBSP}s`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  // « 1 h 1 » se lit mal ; une heure se dit avec ses deux chiffres de minutes.
  return mins === 0
    ? `${hours}${NBSP}h`
    : `${hours}${NBSP}h${NBSP}${String(mins).padStart(2, '0')}`;
};

/**
 * La même quantité, mais qui court.
 *
 * La seule exception admise à la règle ci-dessus, et pour une raison : un
 * chronomètre en salle répond à « combien me reste-t-il », et « 119 s » oblige
 * à diviser de tête en plein effort. Au-delà d'une minute on écrit donc m:ss,
 * la convention de tous les chronomètres ; en dessous, `formatDuration`
 * lui-même, pour que les deux graphies se rejoignent là où elles le peuvent.
 */
export const formatCountdown = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return formatDuration(total);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
};

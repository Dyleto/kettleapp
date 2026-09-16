/**
 * L'écriture des durées, à une seule adresse.
 *
 * Ce module n'importe rien, et c'est le point : `utils/formatters` a besoin
 * des constantes de bloc, et les constantes de bloc ont besoin d'écrire des
 * durées. Loger la règle chez l'un ou chez l'autre créait un cycle — et un
 * cycle, ici, se serait soldé par une seconde copie de la règle.
 */

/**
 * Une durée prescrite, dans la seule convention de l'application.
 *
 * Quatre s'écrivaient pour la même grandeur — « 2min », « 1min », « 120 s »,
 * « 119s » —, dont deux sur le même écran. Le coach ne pouvait pas se fier à
 * ce qu'il lisait pour savoir ce que son client lirait.
 *
 * La règle : sous une minute, les secondes nues ; au-delà, les minutes, et la
 * seconde restante seulement si elle existe. Toujours une espace insécable
 * avant l'unité — « 45 » et « s » ne se séparent pas en fin de ligne, et un
 * nombre collé à sa lettre se lit comme un mot.
 */
const NBSP = '\u00A0';

export const formatDuration = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total}${NBSP}s`;

  const minutes = Math.floor(total / 60);
  const reste = total % 60;

  if (minutes < 60) {
    return reste === 0
      ? `${minutes}${NBSP}min`
      : `${minutes}${NBSP}min${NBSP}${reste}${NBSP}s`;
  }

  const heures = Math.floor(minutes / 60);
  const mins = minutes % 60;
  // « 1 h 1 » se lit mal ; l'heure se dit avec ses deux chiffres de minutes.
  return mins === 0
    ? `${heures}${NBSP}h`
    : `${heures}${NBSP}h${NBSP}${String(mins).padStart(2, '0')}`;
};

/**
 * La même grandeur, mais qui tourne.
 *
 * Seule dérogation admise à la règle ci-dessus, et pour une raison : un
 * chronomètre en salle répond à « il me reste combien », et « 119 s » oblige à
 * diviser de tête pendant l'effort. Au-delà d'une minute on écrit donc m:ss,
 * la convention de tous les chronomètres ; en dessous, `formatDuration`
 * elle-même, pour que les deux écritures se rejoignent là où elles peuvent.
 */
export const formatCountdown = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return formatDuration(total);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
};

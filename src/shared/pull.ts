/**
 * Tirer pour recharger, la part qui décide — sans écran, pour se tester.
 *
 * Le doigt parcourt l'écran ; l'indicateur le suit à moitié, freiné, et
 * s'arrête à `PULL_MAX`. Un indicateur qui suivait le doigt pixel pour
 * pixel descendait jusqu'au milieu de l'écran : le geste se lit comme une
 * traction quand il résiste.
 */

/** La course de l'indicateur à partir de laquelle relâcher recharge. */
export const PULL_ARM = 64;
const PULL_MAX = 96;
/** Le doigt doit avoir parcouru ceci avant qu'on décide ce qu'il fait. */
const PULL_SLOP = 8;

/** La course de l'indicateur pour une traction du doigt de `finger` px. */
export const pullTravel = (finger: number): number =>
  finger <= 0 ? 0 : Math.min(PULL_MAX, finger / 2);

/**
 * Ce que l'indicateur dit.
 *
 * Hors connexion, il le dit dès la traction, et relâcher ne recharge rien :
 * les requêtes attendraient le réseau, et l'indicateur tournerait sans fin.
 */
export type PullPhase = 'idle' | 'pulling' | 'armed' | 'offline';

export const pullPhase = (travel: number, online: boolean): PullPhase =>
  travel <= 0
    ? 'idle'
    : !online
      ? 'offline'
      : travel >= PULL_ARM
        ? 'armed'
        : 'pulling';

/**
 * Le geste commencé est-il une traction ?
 *
 * Seulement vers le bas, et plus vertical qu'horizontal : de côté, c'est le
 * glisser qui lit une séance dans « À lire », et il doit rester à lui.
 * Tant que le doigt n'a pas parcouru quelques pixels, rien n'est décidé :
 * un doigt posé tremble.
 *
 * La page tout en haut, c'est au départ du doigt que l'écran le vérifie
 * (`PullToRefresh`). Le revérifier ici ne servait à rien : un sabotage de
 * l'une ou l'autre vérification laissait le banc vert, l'autre suffisant.
 */
export const pullIntent = (
  dx: number,
  dy: number
): 'pull' | 'other' | 'undecided' => {
  if (Math.abs(dx) < PULL_SLOP && Math.abs(dy) < PULL_SLOP) return 'undecided';
  return dy > 0 && Math.abs(dy) > Math.abs(dx) ? 'pull' : 'other';
};

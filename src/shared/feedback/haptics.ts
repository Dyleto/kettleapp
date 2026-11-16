import storage from '@/shared/utils/storage';

/**
 * Les vibrations de la séance guidée, sous des noms.
 *
 * Treize appels directs, dans six fichiers, écrivaient chacun leur motif —
 * `navigator.vibrate?.(150)` ici, `[120, 80, 120]` là — et rien ne les
 * coupait : couper le son les laissait vibrer, et aucun réglage ne disait
 * « pas de vibration ».
 *
 * Quatre motifs, comme il y a quatre signaux sonores, et pour la même
 * raison : on les distingue sans regarder.
 */
export type Buzz =
  /** Un geste enregistré : une série cochée, un palier, un tour compté. */
  | 'tap'
  /** Un geste défait : un tour retiré d'un appui long. Deux coups, pour ne
   * pas le confondre avec un tour ajouté. */
  | 'undo'
  /** Une des trois dernières secondes d'un tour, d'un repos, d'une durée. */
  | 'tick'
  /** Le temps est écoulé : tour suivant, bascule effort–repos. */
  | 'go';

/** Ce que chaque motif fait vibrer, en millisecondes : vibrer, se taire,
 * vibrer. Des données, pour les éprouver sans téléphone. */
export const BUZZES: Record<Buzz, number | number[]> = {
  tap: 40,
  undo: [30, 40, 30],
  tick: 150,
  go: [120, 80, 120],
};

/**
 * Le téléphone sait-il vibrer ?
 *
 * Safari sur iPhone ne fournit pas `navigator.vibrate` : un réglage
 * « Vibrations » y promettrait ce que l'appareil ne fait pas, et il ne s'y
 * affiche pas. Un ordinateur le fournit souvent sans moteur derrière ; on ne
 * peut pas le savoir, et le réglage y reste, inoffensif.
 */
export const canVibrate = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

// ─── Le réglage ─────────────────────────────────────────────────────────────

/**
 * On n'écrit que le refus, comme pour le son : une clé absente — premier
 * lancement, stockage refusé, navigation privée — donne le réglage par
 * défaut, et non un silence que personne n'a demandé.
 */
const KEY = 'kettle-vibration';
const OFF = 'off';

const listeners = new Set<() => void>();

/** Les vibrations sont-elles actives sur cet appareil ? */
export const isVibrationEnabled = (): boolean => storage.getItem(KEY) !== OFF;

/** Couper ou remettre les vibrations, et prévenir ceux qui l'affichent. */
export const setVibrationEnabled = (enabled: boolean): void => {
  if (enabled) storage.removeItem(KEY);
  else storage.setItem(KEY, OFF);
  listeners.forEach((notify) => notify());
};

/** S'abonner aux changements du réglage. Rend de quoi se désabonner. */
export const subscribeToVibration = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Faire vibrer un motif, si l'appareil le peut et si on le veut.
 *
 * Un refus du navigateur — onglet en arrière-plan, appareil sans moteur —
 * n'est pas une panne : la séance se suit sans.
 */
export const buzz = (name: Buzz): void => {
  if (!canVibrate() || !isVibrationEnabled()) return;
  try {
    navigator.vibrate(BUZZES[name]);
  } catch {
    // Refusé : tant pis.
  }
};

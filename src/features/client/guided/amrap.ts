/**
 * Ce que l'AMRAP lit dans les mots du coach, en fonctions pures.
 */

/** L'objectif de tours, tel que le coach l'a écrit : « 5 à 6 » → 5..6. */
export interface RoundTarget {
  low: number;
  high: number;
}

/**
 * L'objectif de tours glissé dans la note du bloc.
 *
 * Le coach n'a pas de champ pour le dire : il l'écrit en prose — « Rythme
 * régulier, viser 5-6 tours » — et c'est là qu'on le cherche. Seul un
 * nombre suivi de « tour(s) » compte : « 3 × 10 » ou « 20 kg » dans la même
 * note ne sont pas des objectifs. Un écart à l'envers (« 6 à 5 ») se
 * remet dans l'ordre ; rien de lisible donne `null`, et l'écran montre alors
 * six repères neutres plutôt qu'un objectif inventé.
 */
export const roundTarget = (notes: string | undefined): RoundTarget | null => {
  if (!notes) return null;
  const range = notes.match(
    /(\d{1,2})\s*(?:à|-|–|—|ou)\s*(\d{1,2})\s*tours?\b/i
  );
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    if (a > 0 && b > 0) return { low: Math.min(a, b), high: Math.max(a, b) };
  }
  const single = notes.match(/(\d{1,2})\s*tours?\b/i);
  if (single && Number(single[1]) > 0)
    return { low: Number(single[1]), high: Number(single[1]) };
  return null;
};

/** Combien de repères dessiner : six au moins, assez pour l'objectif et
 * pour ce qui est déjà fait. */
export const markCount = (target: RoundTarget | null, done: number): number =>
  Math.max(6, target?.high ?? 0, done);

/** Ce que la puce du temps affiche, et si le temps est écoulé. */
export interface AmrapReading {
  /** Les secondes affichées : ce qui reste, ou ce qui est passé quand le
   * bloc n'a pas de durée. */
  seconds: number;
  finished: boolean;
}

/**
 * Le temps d'un AMRAP, `elapsed` millisecondes après son départ.
 *
 * Avec une durée, il descend, arrondi vers le haut comme tous les
 * décomptes de la séance : « 1 » reste affiché tant que la dernière seconde
 * n'est pas écoulée. Sans durée — « sans limite » — il monte, arrondi vers
 * le bas comme un chronomètre : la première seconde n'est comptée qu'une
 * fois passée.
 */
export const readAmrap = (
  durationSeconds: number | undefined,
  elapsed: number
): AmrapReading => {
  const at = Math.max(0, elapsed);
  if (!durationSeconds) {
    return { seconds: Math.floor(at / 1000), finished: false };
  }
  const left = durationSeconds * 1000 - at;
  return { seconds: Math.max(0, Math.ceil(left / 1000)), finished: left <= 0 };
};

/**
 * « 08:12 » : les minutes sur deux chiffres, comme sur un chronomètre de
 * salle. La puce garde ainsi sa largeur en passant de « 10:00 » à
 * « 09:59 » ; sans cela, l'en-tête bougeait d'un chiffre à la dixième
 * minute.
 */
export const chipTime = (seconds: number): string =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60
  ).padStart(2, '0')}`;

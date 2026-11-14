import { PerformedValues } from '@/shared/types';

/** Les séries notées d'un mouvement : ce qu'il en faut ici. */
type NotedSets = PerformedValues['sets'];

/**
 * La charge la plus lourde d'un relevé.
 *
 * La « dernière fois » d'un mouvement se résume à elle : c'est la série que
 * l'on se rappelle, celle qu'on cherche à refaire. Une moyenne n'aurait été
 * soulevée par personne.
 */
export const heaviest = (sets: NotedSets | undefined): number | undefined => {
  const weights = (sets ?? [])
    .map((set) => set?.weight)
    .filter((w): w is number => typeof w === 'number' && w > 0);
  return weights.length > 0 ? Math.max(...weights) : undefined;
};

/**
 * La charge à proposer pour une série.
 *
 * Dans cet ordre, parce que chacun en sait plus que le suivant :
 *
 * 1. ce qui est déjà noté pour cette série-là — une série rouverte garde ce
 *    qu'on y a mis ;
 * 2. la dernière charge notée sur une série précédente de la même séance —
 *    qui vient de faire trois séries à 26 kg fera la quatrième à 26 ;
 * 3. la plus lourde série du dernier bilan pour ce mouvement.
 *
 * Rien sinon : on ne propose pas une charge que personne n'a jamais
 * soulevée, et le coach n'en prescrit pas — le contrat n'en porte pas.
 */
export const proposedLoad = (
  noted: NotedSets | undefined,
  rank: number,
  lastTime: NotedSets | undefined
): number | undefined => {
  const own = noted?.[rank - 1]?.weight;
  if (typeof own === 'number' && own > 0) return own;
  for (let i = Math.min(rank - 1, noted?.length ?? 0) - 1; i >= 0; i--) {
    const earlier = noted?.[i]?.weight;
    if (typeof earlier === 'number' && earlier > 0) return earlier;
  }
  return heaviest(lastTime);
};

/** « 22,5 » et non « 22.5 » : la virgule est la marque française. */
export const formatWeight = (weight: number): string =>
  String(Math.round(weight * 2) / 2).replace('.', ',');

/**
 * Ce que la charge affichée est par rapport à la dernière fois.
 *
 * « comme la dernière fois », « + 2 kg sur la dernière fois », « 2 kg de
 * moins ». Rien quand il n'y a pas de dernière fois : on ne compare pas à ce
 * qui n'existe pas.
 */
export const loadLegend = (
  load: number | undefined,
  lastTime: NotedSets | undefined
): string | undefined => {
  const before = heaviest(lastTime);
  if (load === undefined || before === undefined) return undefined;
  const gap = Math.round((load - before) * 2) / 2;
  if (gap === 0) return 'comme la dernière fois';
  if (gap > 0) return `+ ${formatWeight(gap)} kg sur la dernière fois`;
  return `${formatWeight(-gap)} kg de moins`;
};

/**
 * La charge après une touche de − ou de +.
 *
 * Le pas se fait au demi-kilo près, celui des plus petits disques. Sous
 * zéro, la charge s'efface plutôt que de s'écrire « 0 kg » : zéro kilo
 * n'est pas une charge, c'est l'absence d'une, et un relevé ne doit pas
 * l'enregistrer comme une valeur.
 */
export const stepLoad = (
  load: number | undefined,
  delta: number
): number | undefined => {
  if (load === undefined && delta < 0) return undefined;
  const next = Math.round(((load ?? 0) + delta) * 2) / 2;
  return next > 0 ? next : undefined;
};

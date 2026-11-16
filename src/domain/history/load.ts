import { PerformedValues } from '@/shared/types';

/** Les séries notées d'un mouvement : ce qu'il en faut ici. */
export type NotedSets = PerformedValues['sets'];

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

/** « 22,5 » et non « 22.5 » : la virgule est la marque française. */
export const formatWeight = (weight: number): string =>
  String(Math.round(weight * 2) / 2).replace('.', ',');

import type {
  BlockExercise,
  PerformedSet,
  Session,
  SessionBlock,
} from '@/shared/types';
import {
  blockSupportsSets,
  prescribedSetLabels,
} from '@/domain/session/blocks';
import { formatDuration } from '@/shared/utils/duration';
import { performedKey } from '@/domain/history/lastPerformance';
import { truncateAtFirstEmpty } from '@/domain/history/performedFormat';
import { blockMarker, blockTitle } from '@/domain/session/measure';

/**
 * Ce que « Compléter mes charges » décide, en fonctions pures : quels
 * mouvements y figurent, ce qu'on y lit à droite de leur nom, et comment
 * une charge se pose sur une série sans laisser de trou.
 */

/** Un mouvement de la séance, tel que l'écran des charges le liste. */
export interface LoadRow {
  /** L'adresse de son réalisé : `performedKey(bloc, exercice)`. */
  key: string;
  name: string;
  exercise: BlockExercise;
  block: SessionBlock;
  /** Une entrée par série à noter ; le palier quand il y en a un. */
  labels: string[];
  /** « 4 × 10 », « 5 paliers », « Tabata · 8 tours · 4 min ». */
  summary: string;
}

const prescription = (block: SessionBlock, ex: BlockExercise): string => {
  const labels = prescribedSetLabels(block, ex);
  if (block.type === 'ladder') return `${labels.length}\u00A0paliers`;
  if (!blockSupportsSets(block.type))
    return `${blockTitle(block)} · ${blockMarker(block)}`;
  const dose = ex.reps
    ? String(ex.reps)
    : ex.duration
      ? formatDuration(ex.duration)
      : '';
  if (!dose) return labels.length > 1 ? `${labels.length}\u00A0séries` : '';
  if (labels.length > 1) return `${labels.length} × ${dose}`;
  return ex.reps ? `${dose}\u00A0reps` : dose;
};

/**
 * Les mouvements de la séance, dans l'ordre des blocs puis des exercices.
 *
 * Tous, et non seulement ceux qui portent déjà une charge : c'est ici qu'on
 * complète ce qui n'a pas été noté en route.
 */
export const loadRows = (session: Session): LoadRow[] =>
  [...session.blocks]
    .sort((a, b) => a.order - b.order)
    .flatMap((block) =>
      [...block.exercises]
        .sort((a, b) => a.order - b.order)
        .map((exercise) => ({
          key: performedKey(block.order, exercise.order),
          name: exercise.exercise.name,
          exercise,
          block,
          labels: prescribedSetLabels(block, exercise),
          summary: prescription(block, exercise),
        }))
    );

/**
 * La première série sans rien de noté, ou `count` quand toutes le sont.
 *
 * Une série vide arrête l'exercice là — c'est la règle de tout le réalisé
 * (`truncateAtFirstEmpty`). Seule cette série-là s'ouvre donc à la saisie :
 * noter la troisième par-dessus une deuxième vide, c'était la perdre à
 * l'enregistrement, sans un mot.
 */
export const firstOpen = (sets: readonly PerformedSet[], count: number) => {
  const filled = truncateAtFirstEmpty([...sets]).length;
  return Math.min(filled, count);
};

/**
 * Les séries avec une charge posée sur l'une d'elles.
 *
 * Les répétitions déjà notées sont gardées : on corrige une charge, pas la
 * série. Vider la charge d'une série qui n'a rien d'autre l'efface, et
 * avec elle les suivantes — c'est ce que la règle de troncature veut dire.
 */
export const withWeight = (
  sets: readonly PerformedSet[],
  index: number,
  weight: number | undefined
): PerformedSet[] => {
  const next = [...sets];
  while (next.length <= index) next.push({});
  next[index] = { ...next[index], weight };
  if (weight === undefined) delete next[index].weight;
  return truncateAtFirstEmpty(next);
};

/**
 * « Même charge pour les quatre séries » : la première recopiée sur toutes,
 * répétitions comprises quand elles étaient notées sur la série d'origine.
 */
export const sameWeightForAll = (
  sets: readonly PerformedSet[],
  count: number
): PerformedSet[] => {
  const weight = sets[0]?.weight;
  if (weight === undefined) return [...sets];
  return Array.from({ length: count }, (_, i) => ({
    ...(sets[i] ?? {}),
    weight,
  }));
};

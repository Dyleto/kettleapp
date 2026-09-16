import {
  blockSupportsRepsOnly,
  blockSupportsSets,
} from '@/features/program/constants';
import { BlockExercise, BlockType, SessionBlock } from '@/types';
import { formatDuration } from './duration';

/**
 * Retire les accents et diacritiques d'une chaîne (é→e, à→a, ç→c…)
 */
export const stripAccents = (str: string): string =>
  str.normalize('NFD').replace(/[̀-ͯ]/g, '');

export { formatCountdown, formatDuration } from './duration';

/**
 * La prescription d'un exercice, telle qu'elle s'affiche à droite de son nom.
 *
 * `block` est facultatif pour les appelants qui n'ont que le type, mais le
 * fournir change le rendu des blocs Tabata / On-Off : leur effort est défini
 * une fois pour tout le bloc (`workDuration`) et pas sur chaque exercice. Sans
 * lui, ces lignes s'affichaient nues pendant que le mode guidé, lui, montrait
 * « 20s » — la même donnée lue de deux façons selon l'écran.
 */
export const formatExerciseMetric = (
  ex: BlockExercise,
  blockType: BlockType,
  block?: Pick<SessionBlock, 'workDuration'>
): string => {
  const fallback =
    blockSupportsRepsOnly(blockType) && block?.workDuration !== undefined
      ? formatDuration(block.workDuration)
      : '';

  // Même règle que pour les durées : une espace insécable avant l'unité. Un
  // nombre séparé de sa lettre en fin de ligne se lit deux fois.
  const effort = ex.reps
    ? `${ex.reps}\u00A0reps`
    : ex.duration
      ? formatDuration(ex.duration)
      : ex.customMetric
        ? `${ex.customMetric.value}\u00A0${ex.customMetric.unit}`
        : fallback;

  if (!effort) return '';
  if (blockSupportsSets(blockType) && ex.sets && ex.sets > 1) {
    return `${ex.sets} × ${effort}`;
  }
  return effort;
};
